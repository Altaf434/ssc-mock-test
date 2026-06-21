"""
Database setup for SSC CGL Mock Test app.

Why SQLite for v1: zero install, single file, easy to inspect/reset while
verifying locally. Schema is plain SQL so migrating to Postgres later
(if you go public and need concurrent writes at scale) is a connection
string change, not a rewrite.
"""

import sqlite3
import json
import os

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "ssc_app.db"))


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    # One row per mock test paper (a set of questions grouped together)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            source_file TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # One row per question, linked to a test
    cur.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER NOT NULL,
            question_number INTEGER NOT NULL,
            section TEXT NOT NULL,
            question_text TEXT NOT NULL,
            options_json TEXT NOT NULL,   -- JSON array of 4 strings
            correct_option INTEGER NOT NULL, -- 1-4
            explanation TEXT,
            topic TEXT,
            difficulty TEXT,
            FOREIGN KEY (test_id) REFERENCES tests(id)
        )
    """)

    # One row per user (name + state only, no auth/login for v1)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            state TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # One row per test attempt
    cur.execute("""
        CREATE TABLE IF NOT EXISTS attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            test_id INTEGER NOT NULL,
            started_at TEXT DEFAULT CURRENT_TIMESTAMP,
            submitted_at TEXT,
            total_score INTEGER,
            total_correct INTEGER,
            total_wrong INTEGER,
            total_unattempted INTEGER,
            section_scores_json TEXT,  -- JSON: {section: {correct, wrong, unattempted}}
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (test_id) REFERENCES tests(id)
        )
    """)

    # One row per answer within an attempt
    cur.execute("""
        CREATE TABLE IF NOT EXISTS attempt_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attempt_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            selected_option INTEGER,  -- 1-4, NULL if unattempted
            is_correct INTEGER,       -- 0 or 1
            FOREIGN KEY (attempt_id) REFERENCES attempts(id),
            FOREIGN KEY (question_id) REFERENCES questions(id)
        )
    """)

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")


def load_test_from_json(json_path, test_name):
    """
    Load a generated paper JSON (list of question dicts) into the DB
    as a new test. Expects each question dict to have at least:
      question_number, section, question_text, options, correct_option
    Optional: explanation, topic, difficulty
    """
    with open(json_path, encoding="utf-8") as f:
        questions = json.load(f)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO tests (name, source_file) VALUES (?, ?)",
        (test_name, json_path)
    )
    test_id = cur.lastrowid

    for q in questions:
        cur.execute("""
            INSERT INTO questions
                (test_id, question_number, section, question_text,
                 options_json, correct_option, explanation, topic, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            test_id,
            q["question_number"],
            q["section"],
            q["question_text"],
            json.dumps(q["options"], ensure_ascii=False),
            q["correct_option"],
            q.get("explanation", ""),
            q.get("topic", ""),
            q.get("difficulty", ""),
        ))

    conn.commit()
    conn.close()
    print(f"Loaded test '{test_name}' (id={test_id}) with {len(questions)} questions from {json_path}")
    return test_id


if __name__ == "__main__":
    init_db()
