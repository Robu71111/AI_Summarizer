import os
import re
import requests
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_file
from dotenv import load_dotenv
from io import BytesIO
import PyPDF2
import docx
from bs4 import BeautifulSoup

# Load environment variables
load_dotenv()
app = Flask(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MAX_INPUT_LENGTH = 50000  # Increased for file uploads

# Configure upload settings
UPLOAD_FOLDER = "/tmp/uploads"
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_stream):
    """Extract text from PDF file."""
    try:
        pdf_reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        return None

def extract_text_from_docx(file_stream):
    """Extract text from DOCX file."""
    try:
        doc = docx.Document(file_stream)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        return None

def extract_text_from_txt(file_stream):
    """Extract text from TXT file."""
    try:
        return file_stream.read().decode('utf-8')
    except Exception as e:
        return None

def extract_text_from_url(url):
    """Extract main text content from a URL."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
            script.decompose()

        # Get text
        text = soup.get_text()

        # Break into lines and remove leading/trailing space on each
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)

        return text
    except Exception as e:
        return None

def build_prompt(user_text: str, length_choice: str, mode: str = 'paragraph', summary_mode: str = 'standard') -> str:
    """
    Builds a prompt string guiding the model to produce summaries in different formats.
    """
    # Length instructions
    if length_choice == '1':  # short
        length_instructions = "Provide a BRIEF summary (2-3 sentences)."
    elif length_choice == '3':  # long
        length_instructions = "Provide a DETAILED summary with multiple paragraphs."
    else:  # '2' => medium
        length_instructions = "Provide a MODERATE-LENGTH summary (one paragraph)."
    
    # Mode (Output Format) instructions
    if mode == 'bullets':
        format_instructions = (
            "Format your response as bullet points (use • or -). "
            "Each bullet should capture a key point from the text."
        )
    elif mode == 'takeaways':
        format_instructions = (
            "Provide KEY TAKEAWAYS numbered 1, 2, 3, etc. "
            "Focus on the most important insights and actionable points."
        )
    else:  # paragraph or handwriting
        format_instructions = "Write the summary in clear, flowing paragraph form."

    # Summary Mode (Style) instructions
    if summary_mode == 'formal':
        style_instructions = (
            "Use a PROFESSIONAL and FORMAL tone. Use sophisticated vocabulary and structured sentences. "
            "Avoid slang or casual language."
        )
    elif summary_mode == 'creative':
        style_instructions = (
            "Use a CREATIVE and ENGAGING tone. You can use analogies or storytelling elements if appropriate "
            "to make the summary interesting, while remaining accurate to the source."
        )
    else:  # standard
        style_instructions = "Use a STANDARD, neutral, and informative tone."
    
    final_prompt = (
        f"You are an expert summarizer.\n"
        f"{length_instructions} {format_instructions}\n"
        f"{style_instructions}\n"
        "Important: Only include information explicitly stated in the text. "
        "Do not add facts, interpretations, or details not present in the original.\n"
        "If anything is unclear, omit it rather than fabricating information.\n\n"
        "Text to summarize:\n\n"
        f"{user_text}"
    )
    return final_prompt

def call_openrouter_api(prompt_text: str) -> dict:
    """
    Calls OpenRouter API with fallback logic.
    1. Tries Llama 3.1 405B (Free)
    2. If that fails, falls back to 'openrouter/free' (Auto Router)
    """
    if not OPENROUTER_API_KEY:
        return {
            'success': False, 
            'text': '', 
            'error': 'API key not configured. Please add OPENROUTER_API_KEY to your .env file.'
        }
    
    endpoint = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-summarizer-self.vercel.app",
        "X-Title": "AI Summarizer"
    }

    # Define the sequence of models to try
    # 1. Primary: Llama 3.3 70B (High quality)
    # 2. Fallback: OpenRouter Free (Auto-selects best available free model)
    models_to_try = ["meta-llama/llama-3.3-70b-instruct:free", "openrouter/free"]
    
    last_error = None

    for model_id in models_to_try:
        print(f"Attempting summary with model: {model_id}") # Debugging log
        
        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": prompt_text}],
            "temperature": 0.7,
            "max_tokens": 2048
        }

        try:
            # Short timeout for primary to fail fast, longer for fallback
            timeout_seconds = 45 if model_id == "openrouter/free" else 25
            
            response = requests.post(endpoint, json=payload, headers=headers, timeout=timeout_seconds)
            
            if response.status_code == 200:
                data = response.json()
                try:
                    summarized_text = data["choices"][0]["message"]["content"]
                    actual_model = data.get("model", model_id) # Get the actual model used
                    
                    return {
                        'success': True, 
                        'text': summarized_text,
                        'model_used': actual_model # Return this so you can show it in UI later
                    }
                except (KeyError, IndexError) as e:
                    print(f"Format error with {model_id}: {e}")
                    last_error = f'Unexpected response format from {model_id}'
                    continue # Try next model
            else:
                # If 429 (Rate Limit) or 503 (Service Unavailable), we definitely want to continue
                error_msg = response.text
                print(f"Failed {model_id} with status {response.status_code}: {error_msg}")
                last_error = f'API Error ({response.status_code})'
                continue # Try next model

        except requests.Timeout:
            print(f"Timeout connecting to {model_id}")
            last_error = 'Request timed out'
            continue
        except Exception as e:
            print(f"Exception with {model_id}: {str(e)}")
            last_error = str(e)
            continue

    # If we exit the loop, all models failed
    return {
        'success': False,
        'text': '',
        'error': f'All models failed. Last error: {last_error}'
    }

def count_words(text: str) -> int:
    """Count words in text."""
    return len(re.findall(r'\w+', text))

def count_sentences(text: str) -> int:
    """Count sentences in text."""
    return len(re.findall(r'[.!?]+', text))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    user_text = request.form.get('user_text', '').strip()
    length_choice = request.form.get('length', '2')
    mode = request.form.get('mode', 'paragraph')
    summary_mode = request.form.get('summary_mode', 'standard')
    url_input = request.form.get('url_input', '').strip()
    uploaded_file = request.files.get('file_upload')
    
    user_text_url = False

    # Handle URL input
    if url_input:
        user_text = extract_text_from_url(url_input)
        if not user_text:
            return render_template('index.html', error='Failed to fetch content from the provided URL.')
        user_text_url = True

    # Handle file upload
    elif uploaded_file and uploaded_file.filename != '':
        if not allowed_file(uploaded_file.filename):
            return render_template(
                'index.html',
                error='Invalid file type. Please upload PDF, DOCX, or TXT files only.'
            )
        
        filename = uploaded_file.filename
        file_ext = filename.rsplit('.', 1)[1].lower()
        
        # Extract text based on file type
        if file_ext == 'pdf':
            user_text = extract_text_from_pdf(uploaded_file)
        elif file_ext == 'docx':
            user_text = extract_text_from_docx(uploaded_file)
        elif file_ext == 'txt':
            user_text = extract_text_from_txt(uploaded_file)
        
        if not user_text:
            return render_template(
                'index.html',
                error=f'Failed to extract text from {filename}. Please try a different file.'
            )
    
    # Validation
    if not user_text:
        return render_template('index.html', error='Please enter some text, upload a file, or provide a URL to summarize.')
    
    if len(user_text) > MAX_INPUT_LENGTH:
        return render_template(
            'index.html',
            error=f'Text is too long. Maximum {MAX_INPUT_LENGTH} characters allowed.'
        )
    
    # Input statistics
    input_word_count = count_words(user_text)
    input_sentence_count = count_sentences(user_text)
    input_char_count = len(user_text)
    
    # Build prompt and call API
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
    # If you want to show the model used in the template, you can pass it here
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
        model_used=model_used  # Passed to template
    )

@app.route('/export/txt', methods=['POST'])
def export_txt():
    """Export summary as TXT file."""
    summary_text = request.form.get('summary_text', '')
    
    if not summary_text:
        return jsonify({'error': 'No summary to export'}), 400
    
    # Create a BytesIO object
    buffer = BytesIO()
    buffer.write(summary_text.encode('utf-8'))
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name='summary.txt',
        mimetype='text/plain'
    )

@app.route('/export/pdf', methods=['POST'])
def export_pdf():
    """Export summary as PDF file."""
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

        # Register Caveat font if mode is handwriting
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
            except Exception as e:
                print(f"Failed to load font: {e}")
        
        # Create a BytesIO buffer
        buffer = BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#4f46e5',
            spaceAfter=30,
            fontName='Helvetica-Bold'
        )

        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['BodyText'],
            fontName=font_name,
            fontSize=font_size,
            leading=leading
        )
        
        # Add title
        story.append(Paragraph("AI Generated Summary", title_style))
        story.append(Spacer(1, 0.2 * inch))
        
        # Add summary text
        for paragraph in summary_text.split('\n'):
            if paragraph.strip():
                story.append(Paragraph(paragraph, body_style))
                story.append(Spacer(1, 0.1 * inch))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name='summary.pdf',
            mimetype='application/pdf'
        )
    except ImportError:
        return jsonify({'error': 'PDF export not available. Install reportlab: pip install reportlab'}), 500
    except Exception as e:
        return jsonify({'error': f'Failed to generate PDF: {str(e)}'}), 500

@app.route('/api/wordcount', methods=['POST'])
def api_wordcount():
    """API endpoint for real-time word count."""
    text = request.json.get('text', '')
    return jsonify({
        'words': count_words(text),
        'characters': len(text),
        'sentences': count_sentences(text)
    })

@app.route('/translate', methods=['POST'])
def translate():
    """Translate text to target language."""
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