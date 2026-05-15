"""Coding Prep Router - problems, bookmarks, roadmap, company paths, analytics."""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models import User, CodingSubmission
from backend.auth.dependencies import get_current_user
from backend.coding_problems import PROBLEMS, DSA_ROADMAP, COMPANY_PATHS, get_problem, get_problems

router = APIRouter(prefix="/coding", tags=["Coding Prep"])


class BookmarkRequest(BaseModel):
    problem_id: int


# ─── Static routes FIRST (before parameterized /{problem_id}) ─────────────────

@router.get("/roadmap")
def get_roadmap(current_user: User = Depends(get_current_user)):
    return DSA_ROADMAP


@router.get("/company-paths")
def get_company_paths(current_user: User = Depends(get_current_user)):
    return COMPANY_PATHS


@router.get("/analytics")
def coding_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = current_user.id
    bookmarks = db.query(CodingSubmission).filter(CodingSubmission.user_id == uid, CodingSubmission.status == "bookmarked").count()
    solved_ids = set(
        row[0] for row in
        db.query(CodingSubmission.problem_id)
        .filter(CodingSubmission.user_id == uid, CodingSubmission.status == "accepted")
        .distinct().all()
    )
    total = len(PROBLEMS)
    easy = len([p for p in PROBLEMS if p["difficulty"] == "easy"])
    medium = len([p for p in PROBLEMS if p["difficulty"] == "medium"])
    hard = len([p for p in PROBLEMS if p["difficulty"] == "hard"])
    solved_easy = len([p for p in PROBLEMS if p["difficulty"] == "easy" and p["id"] in solved_ids])
    solved_medium = len([p for p in PROBLEMS if p["difficulty"] == "medium" and p["id"] in solved_ids])
    solved_hard = len([p for p in PROBLEMS if p["difficulty"] == "hard" and p["id"] in solved_ids])

    topics = {}
    for p in PROBLEMS:
        topics[p["category"]] = topics.get(p["category"], 0) + 1

    return {
        "total_problems": total,
        "problems_solved": len(solved_ids),
        "bookmarks": bookmarks,
        "easy": {"total": easy, "solved": solved_easy},
        "medium": {"total": medium, "solved": solved_medium},
        "hard": {"total": hard, "solved": solved_hard},
        "topics": topics,
        "completion": round(len(solved_ids) / max(total, 1) * 100, 1),
    }


@router.get("/bookmarks")
def get_bookmarks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bms = db.query(CodingSubmission).filter(
        CodingSubmission.user_id == current_user.id,
        CodingSubmission.status == "bookmarked",
    ).all()
    ids = [b.problem_id for b in bms]
    return [p for p in [{**get_problem(pid), "bookmarked": True} for pid in ids if get_problem(pid)]]


@router.post("/bookmark")
def toggle_bookmark(
    body: BookmarkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(CodingSubmission).filter(
        CodingSubmission.user_id == current_user.id,
        CodingSubmission.problem_id == body.problem_id,
        CodingSubmission.status == "bookmarked",
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False, "message": "Bookmark removed"}

    prob = get_problem(body.problem_id)
    bm = CodingSubmission(
        user_id=current_user.id,
        problem_id=body.problem_id,
        problem_title=prob["title"] if prob else f"Problem {body.problem_id}",
        language="n/a",
        code="",
        status="bookmarked",
        score=0, passed_cases=0, total_cases=0, runtime_ms=0,
    )
    db.add(bm)
    db.commit()
    return {"bookmarked": True, "message": "Problem bookmarked"}


# ─── Parameterized routes AFTER static ones ───────────────────────────────────

@router.get("/problems")
def list_problems(
    category: str = "all",
    difficulty: str = "all",
    company: str = "all",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    problems = get_problems(category, difficulty)
    if company and company != "all":
        problems = [p for p in problems if company in p.get("companies", [])]

    bookmarked_ids = set(
        row[0] for row in
        db.query(CodingSubmission.problem_id)
        .filter(CodingSubmission.user_id == current_user.id, CodingSubmission.status == "bookmarked")
        .distinct().all()
    )
    solved_ids = set(
        row[0] for row in
        db.query(CodingSubmission.problem_id)
        .filter(CodingSubmission.user_id == current_user.id, CodingSubmission.status == "accepted")
        .distinct().all()
    )
    for p in problems:
        p["bookmarked"] = p["id"] in bookmarked_ids
        p["solved"] = p["id"] in solved_ids
    return problems


@router.get("/problems/{problem_id}")
def get_problem_detail(problem_id: int, current_user: User = Depends(get_current_user)):
    prob = get_problem(problem_id)
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found")
    safe = {k: v for k, v in prob.items() if k not in ("test_cases", "starter_python", "starter_js", "py_setup")}
    return safe
