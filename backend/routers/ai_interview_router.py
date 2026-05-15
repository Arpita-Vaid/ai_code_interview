"""AI Interview Router — conversational interview with OpenAI scoring."""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from pydantic import BaseModel

from backend.database import get_db
from backend.models import User, AIInterviewSession, AIInterviewMessage
from backend.auth.dependencies import get_current_user
from backend.ai_engine import generate_question, score_answer

router = APIRouter(prefix="/ai-interview", tags=["AI Interview"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class StartRequest(BaseModel):
    round_type: str  # hr | technical | behavioral

class RespondRequest(BaseModel):
    session_id: int
    answer: str

class EndRequest(BaseModel):
    session_id: int


# ─── Start Session ────────────────────────────────────────────────────────────

@router.post("/start")
async def start_interview(
    payload: StartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.round_type not in ("hr", "technical", "behavioral"):
        raise HTTPException(400, "round_type must be hr, technical, or behavioral")

    # Create session
    session = AIInterviewSession(
        user_id=current_user.id,
        round_type=payload.round_type,
        status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate first question
    q = await generate_question(payload.round_type, [], 1)

    # Save question as message
    msg = AIInterviewMessage(
        session_id=session.id,
        role="interviewer",
        content=q["question"],
    )
    db.add(msg)
    session.total_questions = 1
    db.commit()

    return {
        "session_id": session.id,
        "round_type": payload.round_type,
        "question": q["question"],
        "question_number": 1,
        "source": q["source"],
    }


# ─── Respond (answer + get next question) ─────────────────────────────────────

@router.post("/respond")
async def respond(
    payload: RespondRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(AIInterviewSession).filter(
        AIInterviewSession.id == payload.session_id,
        AIInterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    if session.status != "active":
        raise HTTPException(400, "Session already completed")

    # Get last question
    last_q = db.query(AIInterviewMessage).filter(
        AIInterviewMessage.session_id == session.id,
        AIInterviewMessage.role == "interviewer",
    ).order_by(AIInterviewMessage.id.desc()).first()

    if not last_q:
        raise HTTPException(400, "No question to answer")

    # Score answer
    conversation = _build_conversation(db, session.id)
    scoring = await score_answer(session.round_type, last_q.content, payload.answer, conversation)

    # Save answer
    answer_msg = AIInterviewMessage(
        session_id=session.id,
        role="candidate",
        content=payload.answer,
        score=scoring.get("score", 0),
        feedback=scoring.get("feedback", ""),
        strengths=json.dumps(scoring.get("strengths", [])),
        improvements=json.dumps(scoring.get("improvements", [])),
    )
    db.add(answer_msg)
    db.commit()

    # Generate next question
    conversation.append({"role": "assistant", "content": last_q.content})
    conversation.append({"role": "user", "content": payload.answer})

    next_q_num = session.total_questions + 1
    next_q = await generate_question(session.round_type, conversation, next_q_num)

    next_msg = AIInterviewMessage(
        session_id=session.id,
        role="interviewer",
        content=next_q["question"],
    )
    db.add(next_msg)
    session.total_questions = next_q_num
    db.commit()

    return {
        "score": scoring.get("score", 0),
        "feedback": scoring.get("feedback", ""),
        "strengths": scoring.get("strengths", []),
        "improvements": scoring.get("improvements", []),
        "next_question": next_q["question"],
        "question_number": next_q_num,
        "source": next_q["source"],
    }


# ─── End Session ──────────────────────────────────────────────────────────────

@router.post("/end")
async def end_interview(
    payload: EndRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(AIInterviewSession).filter(
        AIInterviewSession.id == payload.session_id,
        AIInterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")

    # Calculate stats
    answers = db.query(AIInterviewMessage).filter(
        AIInterviewMessage.session_id == session.id,
        AIInterviewMessage.role == "candidate",
    ).all()

    scores = [a.score for a in answers if a.score is not None]
    avg = round(sum(scores) / len(scores), 1) if scores else 0
    duration = int((datetime.now(timezone.utc) - session.created_at.replace(tzinfo=timezone.utc)).total_seconds()) if session.created_at else 0

    session.status = "completed"
    session.avg_score = avg
    session.duration_secs = duration
    session.completed_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "session_id": session.id,
        "status": "completed",
        "total_questions": len(answers),
        "avg_score": avg,
        "duration_secs": duration,
        "answers": [
            {
                "question": _get_question_for_answer(db, session.id, a.id),
                "answer": a.content,
                "score": a.score,
                "feedback": a.feedback,
                "strengths": json.loads(a.strengths) if a.strengths else [],
                "improvements": json.loads(a.improvements) if a.improvements else [],
            }
            for a in answers
        ],
    }


# ─── History ──────────────────────────────────────────────────────────────────

@router.get("/history")
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(AIInterviewSession)
        .filter(AIInterviewSession.user_id == current_user.id)
        .order_by(AIInterviewSession.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": s.id, "round_type": s.round_type, "status": s.status,
            "total_questions": s.total_questions, "avg_score": s.avg_score,
            "duration_secs": s.duration_secs,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


# ─── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics")
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = current_user.id
    sessions = db.query(AIInterviewSession).filter(
        AIInterviewSession.user_id == uid,
        AIInterviewSession.status == "completed",
    ).all()

    by_type = {"hr": [], "technical": [], "behavioral": []}
    for s in sessions:
        if s.avg_score is not None:
            by_type.setdefault(s.round_type, []).append(s.avg_score)

    return {
        "total_sessions": len(sessions),
        "avg_score": round(sum(s.avg_score or 0 for s in sessions) / max(len(sessions), 1), 1),
        "by_round_type": {k: {"count": len(v), "avg": round(sum(v)/max(len(v),1), 1)} for k, v in by_type.items()},
        "recent_scores": [{"type": s.round_type, "score": s.avg_score, "date": s.created_at.isoformat() if s.created_at else None} for s in sessions[:10]],
    }


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _build_conversation(db: Session, session_id: int) -> list[dict]:
    msgs = db.query(AIInterviewMessage).filter(
        AIInterviewMessage.session_id == session_id
    ).order_by(AIInterviewMessage.id).all()
    conv = []
    for m in msgs:
        role = "assistant" if m.role == "interviewer" else "user"
        conv.append({"role": role, "content": m.content})
    return conv


def _get_question_for_answer(db: Session, session_id: int, answer_id: int) -> str:
    q = db.query(AIInterviewMessage).filter(
        AIInterviewMessage.session_id == session_id,
        AIInterviewMessage.role == "interviewer",
        AIInterviewMessage.id < answer_id,
    ).order_by(AIInterviewMessage.id.desc()).first()
    return q.content if q else ""
