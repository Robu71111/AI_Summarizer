# 🤖 AI Summarizer

A powerful, modern web application that transforms lengthy articles and documents into concise summaries. Built with Python (Flask) and powered by the **Google Gemini 2.0 Flash** AI model.

**🚀 [Live Demo](https://ai-summarizer-self.vercel.app)**

---

## ✨ Key Features

* **High Character Limit:** Process documents up to **50,000 characters** (approx. 8,000 words).
* **Multiple Formats:** Generate summaries as Paragraphs, Bullet Points, or Key Takeaways.
* **File Support:** Upload PDF, DOCX, or TXT files directly.
* **Smart History:** Locally saved recent summaries for quick reference.
* **Dark Mode:** Modern, responsive UI with smooth theme switching.
* **One-Click Export:** Download your results as `.txt` or `.pdf` files.

## 🛠️ Tech Stack

* **Backend:** Python (Flask)
* **AI Engine:** Google Gemini 2.0 Flash
* **Frontend:** HTML5, CSS3 (Glassmorphism), JavaScript (Vanilla)
* **Deployment:** Vercel

## ⚙️ Local Setup

### 1. Prerequisites
* Python 3.9+
* API Key

### 2. Installation
```bash
# Clone the repository
git clone [https://github.com/Robu71111/AI_Summarizer.git](https://github.com/Robu71111/AI_Summarizer.git)
cd AI_Summarizer

# Install dependencies
pip install -r requirements.txt

### 3. Configuration
Create a .env file in the root directory:
Code snippet

GOOGLE_API_KEY=your_actual_api_key_here

### 4. Run App
Bash
python app.py
Visit http://localhost:5000 in your browser.

🌐 Deployment
This project is configured for Vercel.

Push your code to GitHub (ensure .env is ignored).

Connect your repo to Vercel.

Add your api key to Environment Variables in the Vercel dashboard.

📝 License
This project is open-source under the MIT License.

Author: Vishva Shukla

Crafted with 💖
