# ⚡ ApplyBot India

> AI-powered job application agent for Indian freshers. Stop applying manually — let the bot do it.

🔗 **Live Demo:** [applybot-three.vercel.app](https://applybot-three.vercel.app)

---

## What It Does

ApplyBot scrapes jobs from Internshala and Remotive, scores them against your resume using AI, and auto-applies to the best matches — while you sleep.

- 📄 **Resume Parser** — Upload your PDF, AI extracts your skills, experience, and projects
- 🔍 **Job Scraper** — Pulls live jobs from Internshala + Remotive every day
- 🤖 **AI Match Scoring** — Scores each job 0–100 based on your profile fit
- ✉️ **Auto Apply** — Fills forms and submits applications with AI-generated cover letters
- 📊 **Application Tracker** — Kanban board to track Applied / Interview / Rejected

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React.js, deployed on Vercel |
| Backend | Django 4.2, REST API, deployed on Railway |
| Database | PostgreSQL (Railway) |
| AI | Groq API (llama-3.3-70b) |
| Automation | Playwright |
| Payments | Razorpay (₹299/₹599 plans) |
| Auth | Token-based + Google OAuth |

---

## Features

- 🔐 User authentication (email + Google OAuth)
- 💳 Subscription plans — Free / Starter ₹299 / Pro ₹599
- 🌙 Dark/light mode dashboard
- 📱 Responsive design
- 🚀 Full CI/CD — push to GitHub, auto deploys to Railway + Vercel

---

## Local Setup

```bash
# Clone the repo
git clone https://github.com/notDEVANG/applybot.git
cd applybot

# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm install
npm start
```

**Required environment variables:**
```
DJANGO_SECRET_KEY=
GROQ_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
INTERNSHALA_EMAIL=
INTERNSHALA_PASSWORD=
```

---

## Pricing

| Plan | Price | Daily Applies |
|------|-------|--------------|
| Free | ₹0 | 5 |
| Starter | ₹299/mo | 25 |
| Pro | ₹599/mo | Unlimited |

---

## Built By

**Devang Pujare** — BE Computer Science, Maharashtra
- GitHub: [@notDEVANG](https://github.com/notDEVANG)
- Built end-to-end in 1 week as a solo project

---

> *"Building things I don't fully understand yet. That's the point."*
