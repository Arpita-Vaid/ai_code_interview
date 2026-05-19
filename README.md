# ⚡ IntelliCode AI — Smart Career Prep Platform

> An AI-powered, full-stack career preparation platform that helps engineers ace interviews, optimize resumes, solve coding challenges, and build personalized learning roadmaps — powered by **Google Gemini AI**.

---

## 🚀 Features

| Module | Description |
|---|---|
| 🎤 **AI Interview** | Voice-enabled mock interviews with real-time Gemini AI feedback |
| 🏢 **Company Prep** | Company-specific interview simulations (Google, Amazon, Meta, etc.) |
| 📄 **Resume Optimizer** | AI rewrites your resume for target companies with ATS scoring & PDF export |
| 💻 **Coding Challenges** | In-browser coding with Monaco editor and auto-evaluation |
| 🗺️ **Roadmap Generator** | Personalized daily study plans based on your performance |
| 😊 **Emotion Detection** | Face-API based expression analysis during mock interviews |
| 🎙️ **Speech Confidence** | Real-time speech-to-text confidence scoring |

---

## 🛠 Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS + Framer Motion
- Lucide Icons, Chart.js, Monaco Editor

**Backend**
- Python 3.11+ + FastAPI
- MongoDB + Beanie ODM
- JWT Authentication (access + refresh tokens)
- Google Gemini 1.5 Flash AI
- ReportLab (PDF generation)

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)
- Google Gemini API key

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/intellicode-ai.git
cd intellicode-ai
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

Create `.env` in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/intellicode_ai
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at: [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
intellicode-ai/
├── backend/
│   ├── app.py                    # FastAPI entrypoint
│   ├── models.py                 # Beanie MongoDB models
│   ├── gemini_service.py         # Gemini AI integration
│   ├── resume_ai_engine.py       # Resume parsing & analysis
│   ├── resume_optimizer.py       # Company-specific AI optimizer
│   ├── resume_pdf_generator.py   # ReportLab PDF generation
│   ├── routers/
│   │   ├── auth_router.py
│   │   ├── resume_router.py
│   │   ├── ai_interview_router.py
│   │   ├── coding_router.py
│   │   └── roadmap_router.py
│   └── auth/
└── frontend/
    ├── src/
    │   ├── pages/               # All page components
    │   ├── components/          # Navbar, shared UI
    │   ├── context/             # Auth context
    │   └── api.js               # Centralized API client
    └── index.html
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Sign in, get JWT tokens |
| POST | `/resume/upload` | Upload PDF resume |
| POST | `/resume/{id}/analyze` | Run AI analysis |
| POST | `/resume/{id}/optimize` | Company-specific AI optimization |
| GET | `/resume/{id}/optimization/{opt_id}/pdf` | Download optimized PDF |
| POST | `/ai-interview/session/start` | Start AI interview session |
| GET | `/roadmap/generate` | Generate personalized roadmap |

---

## 🌐 Deployment

### Backend (e.g., Railway / Render)
```bash
uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

### Frontend (e.g., Vercel / Netlify)
```bash
cd frontend && npm run build
# Deploy the `dist/` folder
```

Update `FRONTEND_URL` in `.env` and `VITE_API_URL` in frontend env to your deployed URLs.

---

## 📄 License

MIT License — © 2026 IntelliCode AI