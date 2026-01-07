# AI Text Summarizer

## Overview
AI Text Summarizer is a powerful, user-friendly web application designed to transform lengthy documents into concise, meaningful summaries. Leveraging advanced AI models via the OpenRouter API, it supports multiple input formats including direct text entry, PDF, DOCX, and TXT files.

## Features
- **Multi-Format Support:** Upload .pdf, .docx, and .txt files or paste text directly.
- **Customizable Summaries:** Choose from Short, Medium, or Long lengths.
- **Tone Selection:** Standard, Formal, or Creative summary modes.
- **Output Styles:** Paragraph, Bullet Points, Key Takeaways, or "Handwriting" style.
- **Export Options:** Download summaries as PDF or TXT, or copy to clipboard.
- **History Tracking:** Automatically saves recent summaries for quick access.
- **Responsive Design:** A beautiful, classic themed interface that works on all devices.

## Tech Stack
- **Backend:** Python (Flask)
- **Frontend:** HTML5, CSS3, JavaScript (Bootstrap 4)
- **AI Integration:** OpenRouter API
- **File Processing:** PyPDF2 (PDF), python-docx (DOCX)
- **PDF Generation:** ReportLab

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ai-text-summarizer
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

4. **Run the Application:**
   ```bash
   python3 app.py
   ```

5. **Access the App:**
   Open your browser and navigate to `http://localhost:5000`.

## Developer
Developed by **Vishva Shukla**.
