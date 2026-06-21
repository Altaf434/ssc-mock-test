"""
SSC CGL Mock Test - Backend API

Endpoints:
  GET  /api/tests                 -> list available tests
  GET  /api/tests/{test_id}       -> get test questions (WITHOUT correct answers)
  POST /api/users                 -> create a user (name + state), returns user_id
  POST /api/attempts/start        -> start an attempt (user_id + test_id)
  POST /api/attempts/{id}/submit  -> submit answers, returns score + per-question result
  GET  /api/attempts/{id}         -> get a past attempt's full result (for review page)
  GET  /api/tests/{test_id}/stats -> how many users have attempted this test (tracking)

Run locally:
  uvicorn main:app --reload --port 8000
"""

import json
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_connection, init_db

app = FastAPI(title="SSC CGL Mock Test API")

# Allow the local React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this before going public
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()  # safe to call repeatedly, CREATE TABLE IF NOT EXISTS


# ----------------------------------------------------------------------
# Pydantic request/response models
# ----------------------------------------------------------------------

class CreateUserRequest(BaseModel):
    name: str
    state: str


class StartAttemptRequest(BaseModel):
    user_id: int
    test_id: int


class SubmitAnswer(BaseModel):
    question_id: int
    selected_option: Optional[int] = None  # 1-4, or None if unattempted


class SubmitAttemptRequest(BaseModel):
    answers: list[SubmitAnswer]


# ----------------------------------------------------------------------
# Tests
# ----------------------------------------------------------------------

@app.get("/api/tests")
def list_tests():
    conn = get_connection()
    rows = conn.execute("""
        SELECT t.id, t.name, t.created_at, COUNT(q.id) as question_count
        FROM tests t
        LEFT JOIN questions q ON q.test_id = t.id
        GROUP BY t.id
        ORDER BY t.id
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/tests/{test_id}")
def get_test(test_id: int):
    conn = get_connection()
    test = conn.execute("SELECT * FROM tests WHERE id = ?", (test_id,)).fetchone()
    if not test:
        conn.close()
        raise HTTPException(404, "Test not found")

    questions = conn.execute("""
        SELECT id, question_number, section, question_text, options_json
        FROM questions WHERE test_id = ? ORDER BY question_number
    """, (test_id,)).fetchall()
    conn.close()

    # IMPORTANT: do not include correct_option or explanation here --
    # this is what the user sees while taking the test.
    return {
        "id": test["id"],
        "name": test["name"],
        "questions": [
            {
                "id": q["id"],
                "question_number": q["question_number"],
                "section": q["section"],
                "question_text": q["question_text"],
                "options": json.loads(q["options_json"]),
            }
            for q in questions
        ],
    }


@app.get("/api/tests/{test_id}/stats")
def test_stats(test_id: int):
    conn = get_connection()
    row = conn.execute("""
        SELECT COUNT(DISTINCT user_id) as unique_users,
               COUNT(*) as total_attempts
        FROM attempts WHERE test_id = ? AND submitted_at IS NOT NULL
    """, (test_id,)).fetchone()
    conn.close()
    return dict(row)


# ----------------------------------------------------------------------
# Users (name + state only, no auth for v1)
# ----------------------------------------------------------------------

@app.post("/api/users")
def create_user(req: CreateUserRequest):
    if not req.name.strip() or not req.state.strip():
        raise HTTPException(400, "Name and state are required")

    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO users (name, state) VALUES (?, ?)",
        (req.name.strip(), req.state.strip())
    )
    conn.commit()
    user_id = cur.lastrowid
    conn.close()
    return {"user_id": user_id, "name": req.name, "state": req.state}


# ----------------------------------------------------------------------
# Attempts
# ----------------------------------------------------------------------

@app.post("/api/attempts/start")
def start_attempt(req: StartAttemptRequest):
    conn = get_connection()

    user = conn.execute("SELECT id FROM users WHERE id = ?", (req.user_id,)).fetchone()
    test = conn.execute("SELECT id FROM tests WHERE id = ?", (req.test_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(404, "User not found")
    if not test:
        conn.close()
        raise HTTPException(404, "Test not found")

    cur = conn.execute(
        "INSERT INTO attempts (user_id, test_id) VALUES (?, ?)",
        (req.user_id, req.test_id)
    )
    conn.commit()
    attempt_id = cur.lastrowid
    conn.close()
    return {"attempt_id": attempt_id}


@app.post("/api/attempts/{attempt_id}/submit")
def submit_attempt(attempt_id: int, req: SubmitAttemptRequest):
    conn = get_connection()

    attempt = conn.execute("SELECT * FROM attempts WHERE id = ?", (attempt_id,)).fetchone()
    if not attempt:
        conn.close()
        raise HTTPException(404, "Attempt not found")
    if attempt["submitted_at"] is not None:
        conn.close()
        raise HTTPException(400, "Attempt already submitted")

    # Load all questions for this test, keyed by question id
    questions = conn.execute(
        "SELECT * FROM questions WHERE test_id = ?", (attempt["test_id"],)
    ).fetchall()
    q_by_id = {q["id"]: q for q in questions}

    section_scores = {}  # section -> {correct, wrong, unattempted}
    total_correct = 0
    total_wrong = 0
    total_unattempted = 0

    answered_qids = set()

    for ans in req.answers:
        q = q_by_id.get(ans.question_id)
        if q is None:
            continue
        answered_qids.add(ans.question_id)

        section = q["section"]
        section_scores.setdefault(section, {"correct": 0, "wrong": 0, "unattempted": 0})

        if ans.selected_option is None:
            is_correct = None
            total_unattempted += 1
            section_scores[section]["unattempted"] += 1
        else:
            is_correct = 1 if ans.selected_option == q["correct_option"] else 0
            if is_correct:
                total_correct += 1
                section_scores[section]["correct"] += 1
            else:
                total_wrong += 1
                section_scores[section]["wrong"] += 1

        conn.execute("""
            INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct)
            VALUES (?, ?, ?, ?)
        """, (attempt_id, ans.question_id, ans.selected_option, is_correct))

    # Any question not included in the submitted answers = unattempted
    for qid, q in q_by_id.items():
        if qid not in answered_qids:
            section = q["section"]
            section_scores.setdefault(section, {"correct": 0, "wrong": 0, "unattempted": 0})
            section_scores[section]["unattempted"] += 1
            total_unattempted += 1
            conn.execute("""
                INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct)
                VALUES (?, ?, NULL, NULL)
            """, (attempt_id, qid))

    # Simple scoring: +1 correct, -0.25 wrong (standard SSC CGL negative marking)
    total_score = total_correct * 1 - total_wrong * 0.25

    conn.execute("""
        UPDATE attempts
        SET submitted_at = CURRENT_TIMESTAMP,
            total_score = ?, total_correct = ?, total_wrong = ?,
            total_unattempted = ?, section_scores_json = ?
        WHERE id = ?
    """, (
        total_score, total_correct, total_wrong, total_unattempted,
        json.dumps(section_scores), attempt_id
    ))
    conn.commit()
    conn.close()

    return get_attempt_result(attempt_id)


@app.get("/api/attempts/{attempt_id}")
def get_attempt_result(attempt_id: int):
    conn = get_connection()

    attempt = conn.execute("SELECT * FROM attempts WHERE id = ?", (attempt_id,)).fetchone()
    if not attempt:
        conn.close()
        raise HTTPException(404, "Attempt not found")
    if attempt["submitted_at"] is None:
        conn.close()
        raise HTTPException(400, "Attempt not yet submitted")

    answers = conn.execute("""
        SELECT aa.*, q.question_number, q.section, q.question_text,
               q.options_json, q.correct_option, q.explanation, q.topic, q.difficulty
        FROM attempt_answers aa
        JOIN questions q ON q.id = aa.question_id
        WHERE aa.attempt_id = ?
        ORDER BY q.question_number
    """, (attempt_id,)).fetchall()
    conn.close()

    question_results = [
        {
            "question_id": a["question_id"],
            "question_number": a["question_number"],
            "section": a["section"],
            "question_text": a["question_text"],
            "options": json.loads(a["options_json"]),
            "correct_option": a["correct_option"],
            "selected_option": a["selected_option"],
            "is_correct": a["is_correct"],
            "explanation": a["explanation"],
            "topic": a["topic"],
            "difficulty": a["difficulty"],
        }
        for a in answers
    ]

    return {
        "attempt_id": attempt["id"],
        "test_id": attempt["test_id"],
        "total_score": attempt["total_score"],
        "total_correct": attempt["total_correct"],
        "total_wrong": attempt["total_wrong"],
        "total_unattempted": attempt["total_unattempted"],
        "section_scores": json.loads(attempt["section_scores_json"]),
        "questions": question_results,
    }


@app.get("/")
def root():
    return {"status": "ok", "message": "SSC CGL Mock Test API running"}
