# SSC CGL Mock Test - Local v1

A working local version: pick a test, enter name + state, attempt it,
see your score and a full right/wrong review.

## What's inside

```
ssc_app/
  backend/            FastAPI + SQLite
    main.py            API endpoints
    database.py         DB schema + helpers
    load_all_tests.py   Loads your generated_papers/*.json into the DB
    requirements.txt
  frontend/           React (Vite)
    src/
      App.jsx           Screen routing (list -> gate -> taking -> results)
      api.js             API client
      components/
        TestList.jsx      Landing page, lists tests
        UserGate.jsx       Name + state form
        TestTaking.jsx     The actual test UI (OMR-style answer rail)
        ResultsView.jsx    Score + per-question review
  sample_data/
    sample_reasoning_25.json   25 sample questions to test with immediately
```

## Setup (first time)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Load test data. If you already have papers in a `generated_papers/`
folder (from the generation pipeline), edit `GENERATED_PAPERS_DIR` at
the top of `load_all_tests.py` to point at it, then run:

```bash
python load_all_tests.py
```

To try immediately with the bundled sample test instead:

```bash
python -c "from database import init_db, load_test_from_json; init_db(); load_test_from_json('../sample_data/sample_reasoning_25.json', 'Mock Test 1 - Reasoning')"
```

Start the API server:

```bash
uvicorn main:app --reload --port 8000
```

Leave this running. Check it works: open http://localhost:8000/api/tests
in a browser - you should see a JSON list of your loaded tests.

### 2. Frontend

In a new terminal tab:

```bash
cd frontend
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

## How it works

- No login - just name + state, captured right before the test starts,
  stored in the users table.
- Answers are never sent to the browser while testing - the
  /api/tests/{id} endpoint strips correct_option and explanation so
  there's no way to peek via browser dev tools.
- Scoring: +1 per correct answer, -0.25 per wrong answer (standard
  SSC CGL negative marking), 0 for unattempted. Edit the math in
  main.py -> submit_attempt() if you want different marking rules.
- Tracking: every attempt is stored in the attempts table, so once
  you're ready, GET /api/tests/{id}/stats tells you how many unique
  users + total attempts each test has had - this is your "track how
  many users are getting it" requirement from day one.

## Database

SQLite file lives at backend/ssc_app.db. To reset everything during
testing:

```bash
rm backend/ssc_app.db
python load_all_tests.py
```

To inspect data directly:

```bash
sqlite3 backend/ssc_app.db
sqlite> SELECT * FROM attempts;
sqlite> SELECT name, state FROM users;
```

## Going live (free hosting)

This splits across two free services: **Render** for the backend (needs
to stay running) and **Vercel** for the frontend (static build).

### 1. Push the code to GitHub

```bash
cd ssc_app
git init
git add .
git commit -m "Initial commit"
```

Create a new repo on https://github.com/new (public or private, either
is fine), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ssc-mock-test.git
git branch -M main
git push -u origin main
```

### 2. Deploy the backend (Render)

1. Go to https://render.com, sign up (free), connect your GitHub.
2. New + -> Web Service -> pick your repo.
3. Settings:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Instance Type: Free
4. Deploy. Once live, copy the URL Render gives you, e.g.
   `https://ssc-mock-backend.onrender.com`

**Important - load your test data after first deploy.** Render's free
tier filesystem is wiped on every redeploy/restart, so the database
needs reloading each time the service restarts. For now (early
feedback stage), after each deploy open Render's Shell tab (in your
service dashboard) and run:

```bash
python load_all_tests.py
```

(Once you're past the feedback stage and want this to be permanent,
swap SQLite for a hosted Postgres - Render offers a free Postgres
instance too - so data survives restarts. Ask for help wiring this up
when you're ready.)

### 3. Deploy the frontend (Vercel)

1. Go to https://vercel.com, sign up (free), connect your GitHub.
2. New Project -> pick your repo.
3. Settings:
   - Root Directory: `frontend`
   - Framework Preset: Vite (auto-detected)
   - Environment Variable: `VITE_API_BASE` = `https://ssc-mock-backend.onrender.com/api`
     (use YOUR actual Render URL from step 2, keep the `/api` suffix)
4. Deploy. Vercel gives you a live URL like
   `https://ssc-mock-test.vercel.app` - this is what you share.

### 4. Update backend CORS (recommended once you have the Vercel URL)

In `backend/main.py`, change:
```python
allow_origins=["*"]
```
to:
```python
allow_origins=["https://ssc-mock-test.vercel.app"]
```
Commit and push - Render auto-redeploys on every push to `main`.

### Notes on the free tiers

- Render's free web service **sleeps after 15 minutes of no traffic**
  and takes ~30-60 seconds to wake up on the next request. Fine for
  early feedback, annoying at scale - upgrade later if needed.
- Every time Render restarts/redeploys, you'll need to re-run
  `python load_all_tests.py` until you move to persistent Postgres.


