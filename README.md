# 🔐 AuthSystem — Modern JWT + Google OAuth

A production-ready authentication system built with **FastAPI**, **JWT**, and **Google OAuth 2.0**, paired with a premium dark-mode frontend.

---

## ✨ Features

| Feature | Details |
|---|---|
| Email/Password Auth | bcrypt hashed passwords, JWT tokens |
| Google OAuth 2.0 | Full redirect flow, auto account linking |
| Access Token | HS256 JWT, 15-minute expiry |
| Refresh Token | 7-day expiry, revocable blacklist |
| Auto Token Refresh | Frontend silently refreshes on 401 |
| Protected Routes | FastAPI dependency injection |
| Database | SQLite (zero-config), swappable to Postgres |
| CORS | Configured for local frontend dev |

---

## 📁 Project Structure

```
ai_code_interview/
├── backend/
│   ├── app.py              # FastAPI entry point
│   ├── config.py           # Settings (reads .env)
│   ├── database.py         # SQLAlchemy DB setup
│   ├── models.py           # User ORM model
│   ├── schemas.py          # Pydantic schemas
│   ├── auth/
│   │   ├── jwt_handler.py  # JWT create/verify
│   │   ├── oauth_google.py # Google OAuth flow
│   │   └── dependencies.py # get_current_user dep
│   └── routers/
│       ├── auth_router.py  # /auth/* endpoints
│       └── user_router.py  # /users/me
└── frontend/
    ├── index.html          # Login page
    ├── register.html       # Registration page
    ├── dashboard.html      # Protected dashboard
    ├── css/style.css       # Dark glassmorphism CSS
    └── js/
        ├── auth.js         # Login/register logic
        └── dashboard.js    # Protected page logic
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure environment
```bash
copy .env.example .env
# Edit .env and fill in SECRET_KEY (required) and Google credentials (optional)
```

Generate a strong secret:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Run the server
```bash
uvicorn backend.app:app --reload
```

API will be available at: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

### 4. Open the frontend

Open `frontend/index.html` in your browser (or use Live Server in VS Code at port 5500).

---

## 🔗 API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register with email + password |
| POST | `/auth/login` | ❌ | Login → access + refresh token |
| POST | `/auth/refresh` | Refresh token | New access token |
| POST | `/auth/logout` | ❌ | Revoke refresh token |
| GET | `/auth/google` | ❌ | Start Google OAuth flow |
| GET | `/auth/google/callback` | ❌ | OAuth callback → issue JWTs |
| GET | `/users/me` | Bearer token | Get current user profile |

---

## 🔵 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add authorized redirect URI: `http://localhost:8000/auth/google/callback`
4. Copy **Client ID** and **Client Secret** into `.env`

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (never stored in plain text)
- Access tokens expire in **15 minutes**
- Refresh tokens are **revocable** (blacklisted on logout)
- In production: move refresh token blacklist from memory → Redis or DB table
- In production: use a strong random `SECRET_KEY` and set `HTTPS` for redirect URIs