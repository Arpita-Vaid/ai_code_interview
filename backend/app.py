from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.database import engine, Base
from backend.routers.auth_router import router as auth_router
from backend.routers.user_router import router as user_router
from backend.routers.interview_router import router as interview_router
from backend.routers.coding_router import router as coding_router
from backend.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AI Code Interview API",
    description="Modern JWT + Google OAuth auth system with AI-powered interview platform",
    version="2.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "null",  # allows file:// opened pages during dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(interview_router)
app.include_router(coding_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Auth System API is running 🚀",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
