import os
import re
import requests
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_file
from dotenv import load_dotenv
from io import BytesIO
import PyPDF2
import docx
from bs4 import BeautifulSoup

load_dotenv()
app = Flask(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MAX_INPUT_LENGTH = 50000

UPLOAD_FOLDER = "/tmp/uploads"
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Skip signals — if any appear in response, try next model immediately
SKIP_SIGNALS = [
    "rate limit", "ratelimit", "rate_limit", "free tier", "quota exceeded",
    "too many requests", "provider error", "no endpoints", "model not found",
    "not a valid model", "invalid model", "insufficient credits", "never purchased",
    "payment required", "overloaded", "unavailable", "does not exist", "deprecated",
]

def should_skip(text):
    if not text:
        return False
    lower = text.lower()
    return any(sig in lower for sig in SKIP_SIGNALS)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_stream):
    try:
        pdf_reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception:
        return None

def extract_text_from_docx(file_stream):
    try:
        doc = docx.Document(file_stream)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception:
        return None

def extract_text_from_txt(file_stream):
    try:
        return file_stream.read().decode('utf-8')
    except Exception:
        return None

def extract_text_from_url(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
            script.decompose()
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        return text
    except Exception:
        return None

def build_prompt(user_text, length_choice, mode='paragraph', summary_mode='standard'):
    if length_choice == '1':
        length_instructions = "Provide a BRIEF summary (2-3 sentences)."
    elif length_choice == '3':
        length_instructions = "Provide a DETAILED summary with multiple paragraphs."
    else:
        length_instructions = "Provide a MODERATE-LENGTH summary (one paragraph)."
    
    if mode == 'bullets':
        format_instructions = "Format your response as bullet points (use • or -). Each bullet should capture a key point."
    elif mode == 'takeaways':
        format_instructions = "Provide KEY TAKEAWAYS numbered 1, 2, 3, etc. Focus on the most important insights."
    else:
        format_instructions = "Write the summary in clear, flowing paragraph form."

    if summary_mode == 'formal':
        style_instructions = "Use a PROFESSIONAL and FORMAL tone with sophisticated vocabulary."
    elif summary_mode == 'creative':
        style_instructions = "Use a CREATIVE and ENGAGING tone with analogies or storytelling elements."
    else:
        style_instructions = "Use a STANDARD, neutral, and informative tone."
    
    return (
        f"You are an expert summarizer.\n"
        f"{length_instructions} {format_instructions}\n"
        f"{style_instructions}\n"
        "Important: Only include information explicitly stated in the text. "
        "Do not add facts or details not present in the original.\n\n"
        "Text to summarize:\n\n"
        f"{user_text}"
    )

def call_openrouter_api(prompt_text):
    if not OPENROUTER_API_KEY:
        return {'success': False, 'text': '', 'error': 'API key not configured.'}
    
    endpoint = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-summarizer-self.vercel.app",
        "X-Title": "AI Summarizer"
    }

    # Updated free models list — March 2026
    models_to_try = [
        "openrouter/free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "mistralai/mistral-small-3.1-24b-instruct:free",
        "google/gemma-3-27b-it:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "google/gemma-3-12b-it:free",
        "qwen/qwen3-4b:free",
    ]
    
    last_error = None

    for model_id in models_to_try:
        print(f"Trying model: {model_id}")
        
        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": prompt_text}],
            "temperature": 0.7,
            "max_tokens": 2048
        }

        try:
            response = requests.post(endpoint, json=payload, headers=headers, timeout=60)
            
            # Skip on bad status codes
            if response.status_code in (429, 404, 503, 400, 402):
                print(f"HTTP {response.status_code} on {model_id}, skipping...")
                continue
            
            body = response.text
            if should_skip(body):
                print(f"Skip signal on {model_id}")
                continue
            
            if response.status_code == 200:
                data = response.json()
                if 'error' in data:
                    err_msg = str(data['error'])
                    if should_skip(err_msg):
                        continue
                    last_error = err_msg
                    continue
                
                try:
                    summarized_text = data["choices"][0]["message"]["content"]
                    actual_model = data.get("model", model_id)
                    return {
                        'success': True,
                        'text': summarized_text,
                        'model_used': actual_model
                    }
                except (KeyError, IndexError):
                    last_error = f'Unexpected response format from {model_id}'
                    continue
            else:
                last_error = f'API Error ({response.status_code})'
                continue

        except requests.Timeout:
            last_error = 'Request timed out'
            continue
        except Exception as e:
            last_error = str(e)
            continue

    return {
        'success': False,
        'text': '',
        'error': f'All models failed. Last error: {last_error}. Please try again in 1-2 minutes.'
    }

def count_words(text):
    return len(re.findall(r'\w+', text))

def count_sentences(text):
    return len(re.findall(r'[.!?]+', text))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    user_text = request.form.get('user_text', '').strip()
    length_choice = request.form.get('length', '2')
    mode = request.form.get('mode', 'paragraph')
    summary_mode = request.form.get('summary_mode', 'standard')
    uploaded_file = request.files.get('file_upload')
    url_input = request.form.get('url_input', '').strip()
    
    user_text_url = False

    if url_input:
        user_text = extract_text_from_url(url_input)
        if not user_text:
            return render_template('index.html', error='Failed to fetch content from the provided URL.')
        user_text_url = True

    elif uploaded_file and uploaded_file.filename != '':
        if not allowed_file(uploaded_file.filename):
            return render_template('index.html', error='Invalid file type. Please upload PDF, DOCX, or TXT files only.')
        
        filename = uploaded_file.filename
        file_ext = filename.rsplit('.', 1)[1].lower()
        
        if file_ext == 'pdf':
            user_text = extract_text_from_pdf(uploaded_file)
        elif file_ext == 'docx':
            user_text = extract_text_from_docx(uploaded_file)
        elif file_ext == 'txt':
            user_text = extract_text_from_txt(uploaded_file)
        
        if not user_text:
            return render_template('index.html', error=f'Failed to extract text from {filename}.')
    
    if not user_text:
        return render_template('index.html', error='Please enter some text, upload a file, or provide a URL to summarize.')
    
    if len(user_text) > MAX_INPUT_LENGTH:
        return render_template('index.html', error=f'Text is too long. Maximum {MAX_INPUT_LENGTH} characters allowed.')
    
    input_word_count = count_words(user_text)
    input_sentence_count = count_sentences(user_text)
    input_char_count = len(user_text)
    
    prompt = build_prompt(user_text, length_choice, mode, summary_mode)
    result = call_openrouter_api(prompt)
    
    if not result['success']:
        return render_template(
            'index.html',
            error=result.get('error', 'Unknown error occurred'),
            user_text=user_text,
            input_word_count=input_word_count,
            input_sentence_count=input_sentence_count,
            input_char_count=input_char_count
        )
    
    summarized_text = result['text']
    model_used = result.get('model_used', 'Unknown Model')

    summary_word_count = count_words(summarized_text)
    summary_sentence_count = count_sentences(summarized_text)
    summary_char_count = len(summarized_text)
    
    return render_template(
        'index.html',
        summarized_text=summarized_text,
        summary_word_count=summary_word_count,
        summary_sentence_count=summary_sentence_count,
        summary_char_count=summary_char_count,
        input_word_count=input_word_count,
        input_sentence_count=input_sentence_count,
        input_char_count=input_char_count,
        user_text=user_text,
        user_text_url=user_text_url,
        selected_length=length_choice,
        selected_mode=mode,
        selected_summary_mode=summary_mode,
        model_used=model_used
    )

@app.route('/export/txt', methods=['POST'])
def export_txt():
    summary_text = request.form.get('summary_text', '')
    if not summary_text:
        return jsonify({'error': 'No summary to export'}), 400
    buffer = BytesIO()
    buffer.write(summary_text.encode('utf-8'))
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name='summary.txt', mimetype='text/plain')

@app.route('/export/pdf', methods=['POST'])
def export_pdf():
    summary_text = request.form.get('summary_text', '')
    mode = request.form.get('mode', 'paragraph')
    if not summary_text:
        return jsonify({'error': 'No summary to export'}), 400
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont

        font_name = 'Helvetica'
        font_size = 12
        leading = 14

        if mode == 'handwriting':
            try:
                font_path = os.path.join(app.root_path, 'static', 'fonts', 'Caveat-Regular.ttf')
                if os.path.exists(font_path):
                    pdfmetrics.registerFont(TTFont('Caveat', font_path))
                    font_name = 'Caveat'
                    font_size = 18
                    leading = 22
            except Exception:
                pass
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, textColor='#003049', spaceAfter=30, fontName='Helvetica-Bold')
        body_style = ParagraphStyle('CustomBody', parent=styles['BodyText'], fontName=font_name, fontSize=font_size, leading=leading)
        
        story.append(Paragraph("AI Generated Summary", title_style))
        story.append(Spacer(1, 0.2 * inch))
        for paragraph in summary_text.split('\n'):
            if paragraph.strip():
                story.append(Paragraph(paragraph, body_style))
                story.append(Spacer(1, 0.1 * inch))
        doc.build(story)
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name='summary.pdf', mimetype='application/pdf')
    except ImportError:
        return jsonify({'error': 'PDF export not available.'}), 500
    except Exception as e:
        return jsonify({'error': f'Failed to generate PDF: {str(e)}'}), 500

@app.route('/api/wordcount', methods=['POST'])
def api_wordcount():
    text = request.json.get('text', '')
    return jsonify({'words': count_words(text), 'characters': len(text), 'sentences': count_sentences(text)})

@app.route('/translate', methods=['POST'])
def translate():
    data = request.json
    text = data.get('text', '')
    target_language = data.get('target_language', 'english')
    if not text:
        return jsonify({'success': False, 'error': 'No text provided'})
    prompt = (
        f"Translate the following text into {target_language}. "
        "Maintain the original formatting and tone. "
        "Do not add any introductory or concluding remarks, just provide the translation.\n\n"
        f"Text:\n{text}"
    )
    result = call_openrouter_api(prompt)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
