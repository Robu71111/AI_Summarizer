🤖 AI Text Summarizer
An intelligent text summarization tool powered by Google's Gemini AI. Transform lengthy text into concise, meaningful summaries with customizable length and format options.

LIVE DEMO URL: "https://summarize-ftsr8pere-vishvas-projects-ba99e55e.vercel.app/"


✨ Features
🎯 Multiple Summary Lengths - Choose between Short, Medium, or Long summaries
📝 Output Formats - Paragraph, Bullet Points, or Key Takeaways
📊 Real-time Statistics - Word count, character count, and compression ratio
📋 Copy to Clipboard - One-click copy functionality
⚡ Fast Processing - Powered by Google Gemini 2.0 Flash
📱 Responsive Design - Works beautifully on all devices
🎨 Modern UI - Clean, gradient-based interface with smooth animations
🚀 Live Demo
View Live Demo (Add your Vercel URL after deployment)

🛠️ Tech Stack
Backend: Flask (Python)
AI Model: Google Gemini 2.0 Flash
Frontend: HTML5, CSS3, JavaScript (Vanilla)
Styling: Bootstrap 4 + Custom CSS
Icons: Font Awesome 6
Deployment: Vercel
📋 Prerequisites
Python 3.9 or higher
Google Gemini API Key (Get one here)
Git installed on your machine
🔧 Installation & Setup
1. Clone the Repository
bash
git clone https://github.com/YOUR-USERNAME/ai-summarizer.git
cd ai-summarizer
2. Create Virtual Environment
bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
3. Install Dependencies
bash
pip install -r requirements.txt
4. Configure Environment Variables
Create a .env file in the root directory:

env
GOOGLE_API_KEY=your_gemini_api_key_here
⚠️ Important: Never commit your .env file to GitHub!

5. Run the Application
bash
python app.py
Visit http://localhost:5000 in your browser.

🌐 Deployment (Vercel)
Quick Deploy
Show Image

Manual Deployment
Install Vercel CLI:
bash
npm install -g vercel
Login to Vercel:
bash
vercel login
Deploy:
bash
vercel
Add environment variable in Vercel Dashboard:
Go to your project settings
Navigate to "Environment Variables"
Add: GOOGLE_API_KEY = your_api_key
Redeploy
📖 Usage
Enter Text: Paste or type your text in the input area (max 10,000 characters)
Choose Length: Select Short (2-3 sentences), Medium (1 paragraph), or Long (multiple paragraphs)
Select Format: Choose between Paragraph, Bullet Points, or Key Takeaways
Summarize: Click the "Summarize" button or press Ctrl+Enter
Copy: Use the copy button to copy the summary to clipboard
Keyboard Shortcuts
Ctrl/Cmd + Enter - Submit form
Ctrl/Cmd + K - Focus text area
🗂️ Project Structure
ai-summarizer/
├── app.py                      # Flask application
├── requirements.txt            # Python dependencies
├── vercel.json                # Vercel configuration
├── .env                       # Environment variables (not in repo)
├── .gitignore                 # Git ignore rules
├── README.md                  # Documentation
├── templates/
│   └── index.html             # Main HTML template
└── static/
    ├── css/
    │   └── styles.css         # Custom styles
    └── js/
        └── app.js             # JavaScript functionality
🔐 Security
API keys are stored in environment variables
.env file is excluded from version control
Input validation prevents oversized requests
Rate limiting considerations for API usage
🐛 Troubleshooting
API Key Issues
Ensure .env file is in the root directory
Verify API key has no extra spaces or quotes
Check API key is active in Google AI Studio
Deployment Issues
Verify vercel.json exists
Check environment variables are set in Vercel
Review Vercel deployment logs for errors
📊 API Limits (Gemini Free Tier)
60 requests per minute
1,500 requests per day
1 million tokens per minute
🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

Fork the project
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
📝 License
This project is open source and available under the MIT License.

👨‍💻 Author
Your Name

GitHub: @your-username
LinkedIn: Your LinkedIn
🙏 Acknowledgments
Google Gemini AI for the powerful API
Flask for the web framework
Vercel for hosting
📸 Screenshots
Desktop View
Show Image

Mobile View
Show Image

⭐ Star this repo if you find it helpful!

