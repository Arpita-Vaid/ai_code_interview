from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, func
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    # Password auth — nullable for OAuth-only accounts
    hashed_password = Column(String, nullable=True)

    # Google OAuth
    google_id = Column(String, unique=True, nullable=True, index=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ─── Interview Models ──────────────────────────────────────────────────────────

class Question(Base):
    __tablename__ = "questions"

    id          = Column(Integer, primary_key=True, index=True)
    text        = Column(Text, nullable=False)
    category    = Column(String, nullable=False, index=True)   # dsa|system_design|behavioral|javascript|python|sql
    difficulty  = Column(String, nullable=False, index=True)   # easy|medium|hard
    keywords    = Column(Text, nullable=False)                  # comma-separated scoring keywords
    hint        = Column(Text, nullable=True)
    sample_answer = Column(Text, nullable=True)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, nullable=False, index=True)
    category    = Column(String, nullable=False)
    difficulty  = Column(String, nullable=False)
    total_score = Column(Float, nullable=True)           # 0-100 avg across answers
    status      = Column(String, default="in_progress")  # in_progress|completed
    num_questions = Column(Integer, default=5)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)


class SessionAnswer(Base):
    __tablename__ = "session_answers"

    id           = Column(Integer, primary_key=True, index=True)
    session_id   = Column(Integer, nullable=False, index=True)
    question_id  = Column(Integer, nullable=False)
    user_answer  = Column(Text, nullable=False)
    ai_score     = Column(Float, nullable=False)   # 0-100
    ai_feedback  = Column(Text, nullable=False)
    time_taken   = Column(Integer, nullable=True)  # seconds
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


# ─── Coding Submission ─────────────────────────────────────────────────────────

class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, nullable=False, index=True)
    problem_id    = Column(Integer, nullable=False, index=True)
    problem_title = Column(String, nullable=True)
    language      = Column(String, nullable=False)          # python | javascript
    code          = Column(Text, nullable=False)
    status        = Column(String, nullable=False)          # accepted | wrong_answer | tle | error
    score         = Column(Float, nullable=False, default=0)
    passed_cases  = Column(Integer, nullable=False, default=0)
    total_cases   = Column(Integer, nullable=False, default=0)
    runtime_ms    = Column(Integer, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

