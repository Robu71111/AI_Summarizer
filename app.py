import os
import re
import requests
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_file
from dotenv import load_dotenv
from io import BytesIO
import PyPDF2
import docx

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

def build_prompt(user_text: str, length_choice: str, mode: str = 'paragraph') -> str:
    """
    Builds a prompt string guiding the model to produce summaries in different formats.
    
    Args:
        user_text: The text to summarize
        length_choice: '1' (short), '2' (medium), '3' (long)
        mode: 'paragraph', 'bullets', or 'takeaways'
    """
    # Length instructions
    if length_choice == '1':  # short
        length_instructions = "Provide a BRIEF summary (2-3 sentences)."
    elif length_choice == '3':  # long
        length_instructions = "Provide a DETAILED summary with multiple paragraphs."
    else:  # '2' => medium
        length_instructions = "Provide a MODERATE-LENGTH summary (one paragraph)."
    
    # Mode instructions
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
    else:  # paragraph
        format_instructions = "Write the summary in clear, flowing paragraph form."
    
    final_prompt = (
        f"{length_instructions} {format_instructions}\n\n"
        "Important: Only include information explicitly stated in the text. "
        "Do not add facts, interpretations, or details not present in the original.\n"
        "If anything is unclear, omit it rather than fabricating information.\n\n"
        "Text to summarize:\n\n"
        f"{user_text}"
    )
    return final_prompt

def call_openrouter_api(prompt_text: str) -> dict:
    """
    Calls the OpenRouter API with Meta Llama model.
    
    Returns:
        dict with 'success' (bool), 'text' (str), and optional 'error' (str)
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
        "HTTP-Referer": "https://your-app-url.vercel.app",
        "X-Title": "AI Summarizer"
    }
    
    payload = {
        "model": "meta-llama/llama-3.3-70b-instruct:free",
        "messages": [
            {
                "role": "user",
                "content": prompt_text
            }
        ],
        "temperature": 0.7,
        "max_tokens": 2048
    }
    
    try:
        response = requests.post(endpoint, json=payload, headers=headers, timeout=45)
        data = response.json()
        
        if response.status_code == 200:
            try:
                summarized_text = data["choices"][0]["message"]["content"]
                return {'success': True, 'text': summarized_text}
            except (KeyError, IndexError) as e:
                return {
                    'success': False,
                    'text': '',
                    'error': f'Unexpected API response format: {str(e)}'
                }
        else:
            error_msg = data.get('error', {}).get('message', response.text)
            return {
                'success': False,
                'text': '',
                'error': f'API Error (HTTP {response.status_code}): {error_msg}'
            }
    except requests.Timeout:
        return {
            'success': False,
            'text': '',
            'error': 'Request timed out. Please try again.'
        }
    except Exception as e:
        return {
            'success': False,
            'text': '',
            'error': f'Exception: {str(e)}'
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
    uploaded_file = request.files.get('file_upload')
    
    # Handle file upload
    if uploaded_file and uploaded_file.filename != '':
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
        return render_template('index.html', error='Please enter some text or upload a file to summarize.')
    
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
    prompt = build_prompt(user_text, length_choice, mode)
    result = call_openrouter_api(prompt)
    
    if not result['success']:
        return render_template(
            'index.html',
            error=result['error'],
            user_text=user_text,
            input_word_count=input_word_count,
            input_sentence_count=input_sentence_count,
            input_char_count=input_char_count
        )
    
    summarized_text = result['text']
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
        selected_length=length_choice,
        selected_mode=mode
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
    
    if not summary_text:
        return jsonify({'error': 'No summary to export'}), 400
    
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        
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
            spaceAfter=30
        )
        
        # Add title
        story.append(Paragraph("AI Generated Summary", title_style))
        story.append(Spacer(1, 0.2 * inch))
        
        # Add summary text
        for paragraph in summary_text.split('\n'):
            if paragraph.strip():
                story.append(Paragraph(paragraph, styles['BodyText']))
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)