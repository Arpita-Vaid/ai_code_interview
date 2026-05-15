"""Resume Analysis Router — upload, parse, analyze, generate questions."""

import os
import uuid
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Resume, ResumeAnalysis, ResumeInterviewQuestion
from backend.auth.dependencies import get_current_user
from backend.schemas import (
    ResumeOut, ResumeAnalysisOut, ResumeAnalysisRequest, ResumeInterviewQuestionOut,
)
from backend.resume_ai_engine import (
    extract_text_from_pdf,
    extract_resume_sections,
    analyze_resume,
    generate_interview_questions,
)

router = APIRouter(prefix="/resume", tags=["Resume Analysis"])

# Upload directory
UPLOAD_DIR = Path("uploads/resumes")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def _ensure_upload_dir(user_id: int) -> Path:
    """Create user-specific upload directory."""
    user_dir = UPLOAD_DIR / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


def _serialize_analysis(analysis: ResumeAnalysis) -> dict:
    """Convert a ResumeAnalysis ORM row to a dict with parsed JSON fields."""
    def _load_json(val, default=None):
        if val is None:
            return default
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return default

    return {
        "id": analysis.id,
        "resume_id": analysis.resume_id,
        "skills": _load_json(analysis.skills, []),
        "education": _load_json(analysis.education, []),
        "experience": _load_json(analysis.experience, []),
        "projects": _load_json(analysis.projects, []),
        "certifications": _load_json(analysis.certifications, []),
        "technologies": _load_json(analysis.technologies, []),
        "achievements": _load_json(analysis.achievements, []),
        "summary_text": analysis.summary_text,
        "overall_score": analysis.overall_score,
        "ats_score": analysis.ats_score,
        "technical_score": analysis.technical_score,
        "project_score": analysis.project_score,
        "communication_score": analysis.communication_score,
        "readability_score": analysis.readability_score,
        "experience_score": analysis.experience_score,
        "confidence_score": analysis.confidence_score,
        "missing_sections": _load_json(analysis.missing_sections, []),
        "weak_areas": _load_json(analysis.weak_areas, []),
        "ats_issues": _load_json(analysis.ats_issues, []),
        "suggestions": _load_json(analysis.suggestions, []),
        "keyword_analysis": _load_json(analysis.keyword_analysis, {}),
        "skill_gap_analysis": _load_json(analysis.skill_gap_analysis, {}),
        "strengths": _load_json(analysis.strengths, []),
        "weaknesses": _load_json(analysis.weaknesses, []),
        "ats_breakdown": _load_json(analysis.ats_breakdown, {}),
        "improvement_roadmap": _load_json(analysis.improvement_roadmap, []),
        "target_role": analysis.target_role,
        "target_company": analysis.target_company,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
    }


# ─── Upload Resume ────────────────────────────────────────────────────────────

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload a PDF resume."""
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted.")
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are accepted.")

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.")
    if len(content) == 0:
        raise HTTPException(400, "Uploaded file is empty.")

    # Save file
    user_dir = _ensure_upload_dir(user.id)
    stored_name = f"{uuid.uuid4().hex}.pdf"
    file_path = user_dir / stored_name
    file_path.write_bytes(content)

    # Calculate version (count existing resumes + 1)
    existing_count = db.query(Resume).filter(
        Resume.user_id == user.id, Resume.is_active == True
    ).count()

    # Create DB record
    resume = Resume(
        user_id=user.id,
        filename=stored_name,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=len(content),
        version=existing_count + 1,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "id": resume.id,
        "original_filename": resume.original_filename,
        "file_size": resume.file_size,
        "version": resume.version,
        "created_at": resume.created_at.isoformat() if resume.created_at else None,
        "message": "Resume uploaded successfully.",
    }


# ─── List Resumes ────────────────────────────────────────────────────────────

@router.get("/list")
def list_resumes(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all resumes for the current user."""
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == user.id, Resume.is_active == True)
        .order_by(Resume.created_at.desc())
        .all()
    )

    result = []
    for r in resumes:
        analysis = db.query(ResumeAnalysis).filter(
            ResumeAnalysis.resume_id == r.id
        ).order_by(ResumeAnalysis.created_at.desc()).first()

        result.append({
            "id": r.id,
            "original_filename": r.original_filename,
            "file_size": r.file_size,
            "version": r.version,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "has_analysis": analysis is not None,
            "overall_score": analysis.overall_score if analysis else None,
        })

    return result


# ─── Get Resume Details ──────────────────────────────────────────────────────

@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get resume details by ID."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == user.id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    analysis = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.resume_id == resume_id
    ).order_by(ResumeAnalysis.created_at.desc()).first()

    return {
        "id": resume.id,
        "original_filename": resume.original_filename,
        "file_size": resume.file_size,
        "version": resume.version,
        "created_at": resume.created_at.isoformat() if resume.created_at else None,
        "has_analysis": analysis is not None,
        "overall_score": analysis.overall_score if analysis else None,
    }


# ─── Analyze Resume ─────────────────────────────────────────────────────────

@router.post("/{resume_id}/analyze")
async def analyze_resume_endpoint(
    resume_id: int,
    body: ResumeAnalysisRequest = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Run AI analysis on a resume — parse, score, and generate feedback."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == user.id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    # 1. Extract text from PDF
    try:
        text = extract_text_from_pdf(resume.file_path)
    except Exception as e:
        raise HTTPException(500, f"Failed to parse PDF: {str(e)}")

    if not text or len(text.strip()) < 20:
        raise HTTPException(400, "Could not extract meaningful text from the PDF. Ensure the PDF contains selectable text (not scanned images).")

    # 2. Extract sections
    parsed = extract_resume_sections(text)

    # 3. Run AI analysis
    target_role = body.target_role if body else None
    target_company = body.target_company if body else None
    analysis_result = await analyze_resume(parsed, target_role, target_company)

    # 4. Save analysis to DB
    analysis = ResumeAnalysis(
        resume_id=resume_id,
        user_id=user.id,
        skills=json.dumps(parsed.get("skills", [])),
        education=json.dumps(parsed.get("education", [])),
        experience=json.dumps(parsed.get("experience", [])),
        projects=json.dumps(parsed.get("projects", [])),
        certifications=json.dumps(parsed.get("certifications", [])),
        technologies=json.dumps(parsed.get("technologies", [])),
        achievements=json.dumps(parsed.get("achievements", [])),
        summary_text=parsed.get("summary", ""),
        overall_score=analysis_result.get("overall_score", 0),
        ats_score=analysis_result.get("ats_score", 0),
        technical_score=analysis_result.get("technical_score", 0),
        project_score=analysis_result.get("project_score", 0),
        communication_score=analysis_result.get("communication_score", 0),
        readability_score=analysis_result.get("readability_score"),
        experience_score=analysis_result.get("experience_score"),
        confidence_score=analysis_result.get("confidence_score"),
        missing_sections=json.dumps(analysis_result.get("missing_sections", [])),
        weak_areas=json.dumps(analysis_result.get("weak_areas", [])),
        ats_issues=json.dumps(analysis_result.get("ats_issues", [])),
        suggestions=json.dumps(analysis_result.get("suggestions", [])),
        keyword_analysis=json.dumps(analysis_result.get("keyword_analysis", {})),
        skill_gap_analysis=json.dumps(analysis_result.get("skill_gap_analysis", {})),
        strengths=json.dumps(analysis_result.get("strengths", [])),
        weaknesses=json.dumps(analysis_result.get("weaknesses", [])),
        ats_breakdown=json.dumps(analysis_result.get("ats_breakdown", {})),
        improvement_roadmap=json.dumps(analysis_result.get("improvement_roadmap", [])),
        target_role=target_role,
        target_company=target_company,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # 5. Generate interview questions
    interview_qs = await generate_interview_questions(parsed, target_role)

    # Delete old questions for this resume, then insert new ones
    db.query(ResumeInterviewQuestion).filter(
        ResumeInterviewQuestion.resume_id == resume_id,
        ResumeInterviewQuestion.user_id == user.id,
    ).delete()

    for q in interview_qs:
        db_q = ResumeInterviewQuestion(
            resume_id=resume_id,
            user_id=user.id,
            question_text=q.get("question_text", ""),
            category=q.get("category", "technical"),
            difficulty=q.get("difficulty", "medium"),
            source_section=q.get("source_section"),
            source_detail=q.get("source_detail"),
        )
        db.add(db_q)
    db.commit()

    return {
        "analysis": _serialize_analysis(analysis),
        "questions_generated": len(interview_qs),
        "message": "Resume analyzed successfully.",
    }


# ─── Get Analysis Results ────────────────────────────────────────────────────

@router.get("/{resume_id}/analysis")
def get_analysis(
    resume_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get the latest analysis for a resume."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == user.id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    analysis = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.resume_id == resume_id
    ).order_by(ResumeAnalysis.created_at.desc()).first()

    if not analysis:
        raise HTTPException(404, "No analysis found. Please analyze the resume first.")

    return _serialize_analysis(analysis)


# ─── Get Interview Questions ─────────────────────────────────────────────────

@router.get("/{resume_id}/questions")
def get_questions(
    resume_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get AI-generated interview questions for a resume."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == user.id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    questions = db.query(ResumeInterviewQuestion).filter(
        ResumeInterviewQuestion.resume_id == resume_id,
        ResumeInterviewQuestion.user_id == user.id,
    ).all()

    return [
        {
            "id": q.id,
            "question_text": q.question_text,
            "category": q.category,
            "difficulty": q.difficulty,
            "source_section": q.source_section,
            "source_detail": q.source_detail,
        }
        for q in questions
    ]


# ─── Dashboard Analytics ─────────────────────────────────────────────────────

@router.get("/analytics/summary")
def resume_analytics(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get aggregate resume analytics for the dashboard."""
    resumes = db.query(Resume).filter(
        Resume.user_id == user.id, Resume.is_active == True
    ).all()

    analyses = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.user_id == user.id
    ).order_by(ResumeAnalysis.created_at.desc()).all()

    total_questions = db.query(ResumeInterviewQuestion).filter(
        ResumeInterviewQuestion.user_id == user.id
    ).count()

    # Best scores
    best_overall = max((a.overall_score for a in analyses), default=0)
    avg_overall = sum(a.overall_score for a in analyses) / len(analyses) if analyses else 0
    latest_analysis = analyses[0] if analyses else None

    # Score history for trend chart
    score_history = [
        {
            "date": a.created_at.isoformat() if a.created_at else "",
            "overall": a.overall_score,
            "ats": a.ats_score,
            "technical": a.technical_score,
        }
        for a in reversed(analyses[:10])
    ]

    return {
        "total_resumes": len(resumes),
        "total_analyses": len(analyses),
        "total_questions": total_questions,
        "best_score": best_overall,
        "avg_score": round(avg_overall, 1),
        "latest_scores": {
            "overall": latest_analysis.overall_score if latest_analysis else None,
            "ats": latest_analysis.ats_score if latest_analysis else None,
            "technical": latest_analysis.technical_score if latest_analysis else None,
            "project": latest_analysis.project_score if latest_analysis else None,
            "communication": latest_analysis.communication_score if latest_analysis else None,
        } if latest_analysis else None,
        "score_history": score_history,
    }


# ─── Delete Resume ───────────────────────────────────────────────────────────

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Soft-delete a resume."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.user_id == user.id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    resume.is_active = False
    db.commit()

    return {"message": "Resume deleted successfully."}
