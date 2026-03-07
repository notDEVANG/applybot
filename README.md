# 📄 Resume Parser — Phase 1 of ApplyBot India

A Python tool that reads a PDF resume and extracts structured data using Google Gemini AI. This is Phase 1 of the ApplyBot India project — an AI-powered job application agent for Indian freshers.

---

## 🚀 What It Does

- Accepts any PDF resume as input
- Extracts raw text using `pdfplumber`
- Sends the text to Google Gemini AI for intelligent parsing
- Returns a clean, structured JSON with name, skills, experience, projects, education, and more
- Saves the output as a `.json` file automatically

---

## 📁 Project Structure

```
applybot/
│
├── resume_parser.py       # Main parser script
├── requirements.txt       # Python dependencies
└── README.md              # You are here
```

---

## ⚙️ Setup Instructions

### 1. Clone or download this project

```bash
git clone https://github.com/yourusername/applybot.git
cd applybot
```

### 2. Create a virtual environment (recommended)

```bash
python -m venv venv

# Activate it:
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Get your free Gemini API key

- Go to [aistudio.google.com](https://aistudio.google.com)
- Sign in with your Google account
- Click **"Get API Key"** → **Create API Key**
- Copy the key

### 5. Set your API key as an environment variable

**Windows (Command Prompt):**
```bash
set GEMINI_API_KEY=your_api_key_here
```

**Windows (PowerShell):**
```bash
$env:GEMINI_API_KEY="your_api_key_here"
```

**Mac/Linux:**
```bash
export GEMINI_API_KEY=your_api_key_here
```

> ⚠️ Never hardcode your API key directly in the code. Always use environment variables.

---

## ▶️ How to Run

```bash
python resume_parser.py your_resume.pdf
```

**Example:**
```bash
python resume_parser.py devang_resume.pdf
```

---

## 📊 Sample Output

```json
{
  "name": "Devang Pujare",
  "email": "devangpujare@gmail.com",
  "phone": "7083414211",
  "skills": ["Python", "REST APIs", "Django", "React.js"],
  "languages": ["Python", "JavaScript", "HTML", "CSS"],
  "frameworks": ["React.js", "Django"],
  "tools": ["Git", "GitHub", "VS Code"],
  "experience": [
    {
      "role": "Web Development Intern",
      "company": "S.S. Infotech",
      "duration": "2024",
      "responsibilities": [
        "Developed and optimized frontend website components",
        "Improved UI structure through responsive design"
      ]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Engineering in Computer Science",
      "institution": "Rajendra Mane College of Engineering & Technology",
      "year": "2021-2025",
      "score": "8.1 CGPA"
    }
  ],
  "projects": [
    {
      "name": "API Automation CLI",
      "tech_stack": ["Python", "REST APIs", "CLI"],
      "description": "Built a Python CLI tool to fetch data from REST APIs and store structured JSON output"
    }
  ],
  "summary": "Backend Python Developer with experience in API automation and CLI-based workflows."
}
```

The parsed JSON is also saved automatically as `your_resume_parsed.json` in the same folder.

---

## 🛠️ Troubleshooting

**"Could not extract text from PDF"**
→ Your PDF might be a scanned image. Use a PDF that was digitally created (like one exported from Word or Google Docs).

**"GEMINI_API_KEY not found"**
→ Make sure you set the environment variable in the same terminal session where you're running the script.

**"ModuleNotFoundError"**
→ Make sure your virtual environment is activated and you've run `pip install -r requirements.txt`.

---

## 🔮 What's Next (Phase 2)

This parser is Phase 1 of ApplyBot India. Coming next:
- **Phase 2:** Job scraper for Internshala and Naukri
- **Phase 3:** AI matching engine (resume vs job description)
- **Phase 4:** Auto-apply bot using Playwright
- **Phase 5:** React dashboard + Razorpay subscriptions

---

## 📄 License

MIT License — free to use, modify, and build on.