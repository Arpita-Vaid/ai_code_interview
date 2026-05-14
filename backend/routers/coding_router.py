import subprocess
import tempfile
import os
import time
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from pydantic import BaseModel

from backend.database import get_db
from backend.models import CodingSubmission
from backend.auth.dependencies import get_current_user
from backend.models import User
from backend.coding_problems import PROBLEMS, get_problem, get_problems

router = APIRouter(prefix="/coding", tags=["Coding Interview"])

TIMEOUT = 5  # seconds per test case

# ─── Schemas ──────────────────────────────────────────────────────────────────

class RunRequest(BaseModel):
    problem_id: int
    language: str       # "python" | "javascript"
    code: str

class SubmitRequest(BaseModel):
    problem_id: int
    language: str
    code: str

# ─── Code Execution Engine ────────────────────────────────────────────────────

def _run_python(code: str) -> dict:
    """Execute Python code and return stdout/stderr/runtime."""
    start = time.time()
    try:
        result = subprocess.run(
            ["python", "-c", code],
            capture_output=True, text=True,
            timeout=TIMEOUT,
        )
        runtime = round((time.time() - start) * 1000)
        return {
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "runtime_ms": runtime,
            "error": None,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "", "runtime_ms": TIMEOUT*1000, "error": "Time Limit Exceeded"}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "runtime_ms": 0, "error": "Runtime Error"}


def _run_js(code: str) -> dict:
    """Execute JavaScript code via Node.js."""
    start = time.time()
    try:
        result = subprocess.run(
            ["node", "-e", code],
            capture_output=True, text=True,
            timeout=TIMEOUT,
        )
        runtime = round((time.time() - start) * 1000)
        return {
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "runtime_ms": runtime,
            "error": None,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "", "runtime_ms": TIMEOUT*1000, "error": "Time Limit Exceeded"}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "runtime_ms": 0, "error": "Runtime Error"}


def execute_code(code: str, language: str) -> dict:
    if language == "python":
        return _run_python(code)
    elif language == "javascript":
        return _run_js(code)
    else:
        return {"stdout": "", "stderr": "Unsupported language", "runtime_ms": 0, "error": "Unsupported language"}


def run_test_case(user_code: str, test_case: dict, language: str) -> dict:
    """Inject user code + test call and compare output."""
    call = test_case["input"]
    expected = str(test_case["expected"]).strip()

    if language == "python":
        full_code = f"{user_code}\nprint({call})"
    else:
        # JS: wrap in try-catch, convert output
        full_code = f"{user_code}\ntry{{console.log(JSON.stringify({call}));}}catch(e){{console.error(e.message);}}"

    result = execute_code(full_code, language)
    actual = result["stdout"].strip()

    # Normalize comparison (handle list representations)
    passed = _outputs_match(actual, expected, language)

    return {
        "input": test_case["input"],
        "expected": expected,
        "actual": actual,
        "passed": passed,
        "runtime_ms": result["runtime_ms"],
        "error": result.get("error") or result.get("stderr") or None,
    }


def _outputs_match(actual: str, expected: str, language: str) -> bool:
    """Flexible comparison — handles [0,1] vs [0, 1] etc."""
    if actual == expected:
        return True
    try:
        # Try parsing both as JSON/Python literals
        import ast
        a = ast.literal_eval(actual)
        e = ast.literal_eval(expected)
        return a == e
    except Exception:
        pass
    # Normalize whitespace
    return actual.replace(" ", "").lower() == expected.replace(" ", "").lower()


def ai_feedback(passed: int, total: int, language: str, runtime_ms: int) -> str:
    pct = (passed / total * 100) if total else 0
    if pct == 100:
        tips = []
        if runtime_ms > 200:
            tips.append("Consider optimizing time complexity — current runtime is high.")
        return f"✅ All {total} test cases passed! " + (" ".join(tips) or "Great solution!")
    elif pct >= 60:
        return f"📝 {passed}/{total} test cases passed. Check edge cases like empty arrays, single elements, and negative numbers."
    else:
        return f"❌ {passed}/{total} test cases passed. Re-read the problem constraints and trace through examples manually."

# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/problems")
def list_problems(
    category: str = "all",
    difficulty: str = "all",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    problems = get_problems(category, difficulty)
    # Mark solved
    solved_ids = set(
        row[0] for row in
        db.query(CodingSubmission.problem_id)
        .filter(CodingSubmission.user_id == current_user.id, CodingSubmission.status == "accepted")
        .distinct().all()
    )
    for p in problems:
        p["solved"] = p["id"] in solved_ids
    return problems


@router.get("/problems/{problem_id}")
def get_problem_detail(
    problem_id: int,
    current_user: User = Depends(get_current_user),
):
    prob = get_problem(problem_id)
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found")
    # Don't expose internal test setup
    safe = {k: v for k, v in prob.items() if k not in ("test_cases",)}
    # Return visible examples as test cases to frontend
    safe["sample_tests"] = prob["test_cases"][:2]
    return safe


@router.post("/run")
def run_code(
    payload: RunRequest,
    current_user: User = Depends(get_current_user),
):
    """Run user code against sample test cases only."""
    prob = get_problem(payload.problem_id)
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found")
    if payload.language not in ("python", "javascript"):
        raise HTTPException(status_code=400, detail="Language must be 'python' or 'javascript'")
    if len(payload.code) > 10000:
        raise HTTPException(status_code=400, detail="Code too long (max 10000 chars)")

    sample_cases = prob["test_cases"][:2]  # only sample cases
    results = [run_test_case(payload.code, tc, payload.language) for tc in sample_cases]
    passed = sum(1 for r in results if r["passed"])

    return {
        "status": "ok",
        "passed": passed,
        "total": len(results),
        "results": results,
    }


@router.post("/submit")
def submit_code(
    payload: SubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run against ALL test cases and record submission."""
    prob = get_problem(payload.problem_id)
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found")
    if payload.language not in ("python", "javascript"):
        raise HTTPException(status_code=400, detail="Language must be 'python' or 'javascript'")

    all_cases = prob["test_cases"]
    results = [run_test_case(payload.code, tc, payload.language) for tc in all_cases]
    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    score = round(passed / total * 100)
    avg_runtime = round(sum(r["runtime_ms"] for r in results) / max(total, 1))
    status = "accepted" if passed == total else "wrong_answer"
    if any(r.get("error") == "Time Limit Exceeded" for r in results):
        status = "tle"

    # Save submission
    sub = CodingSubmission(
        user_id=current_user.id,
        problem_id=payload.problem_id,
        problem_title=prob["title"],
        language=payload.language,
        code=payload.code,
        status=status,
        score=score,
        passed_cases=passed,
        total_cases=total,
        runtime_ms=avg_runtime,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    return {
        "submission_id": sub.id,
        "status": status,
        "score": score,
        "passed": passed,
        "total": total,
        "runtime_ms": avg_runtime,
        "results": results,
        "ai_feedback": ai_feedback(passed, total, payload.language, avg_runtime),
    }


@router.get("/submissions")
def get_submissions(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subs = (
        db.query(CodingSubmission)
        .filter(CodingSubmission.user_id == current_user.id)
        .order_by(CodingSubmission.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": s.id, "problem_id": s.problem_id, "title": s.problem_title,
            "language": s.language, "status": s.status, "score": s.score,
            "runtime_ms": s.runtime_ms,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in subs
    ]


@router.get("/analytics")
def coding_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = current_user.id
    subs = db.query(CodingSubmission).filter(CodingSubmission.user_id == uid).all()
    solved = {s.problem_id for s in subs if s.status == "accepted"}
    total_problems = len(PROBLEMS)

    return {
        "total_submissions": len(subs),
        "problems_solved": len(solved),
        "total_problems": total_problems,
        "acceptance_rate": round(len(solved) / max(len(subs), 1) * 100, 1),
        "languages": {
            "python": sum(1 for s in subs if s.language == "python"),
            "javascript": sum(1 for s in subs if s.language == "javascript"),
        },
    }
