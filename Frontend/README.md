# SafrSaathi — PRTC Transport Portal

Your existing React/Vite frontend is now connected to a Python FastAPI backend and SQL database layer.

## What is connected

- Student, corporate, passenger, college-admin, and PRTC-admin accounts
- Password hashing + JWT token issuance
- User profile persistence
- Student concession applications
- College approval / rejection updates
- PRTC final approval / rejection updates
- Passenger ticket creation
- Colleges and route schedules from the database
- Document upload API for Aadhaar / fee-receipt PDFs or images
- SQLite by default, with PostgreSQL support through `DATABASE_URL`

## 1. Start the Python backend

Python 3.11+ is recommended.

```bash
cd backend
python -m venv .venv
```

Activate it:

**Windows PowerShell**
```powershell
.venv\Scripts\Activate.ps1
```

**macOS/Linux**
```bash
source .venv/bin/activate
```

Install and start:

```bash
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

Backend: `http://localhost:8000`
Swagger API docs: `http://localhost:8000/docs`

The SQLite database is created at `backend/data/prtc.db`.

## 2. Start the existing frontend

Open a second terminal in the project root:

```bash
npm install
npm run dev
```

Frontend: `http://localhost:3000`

The frontend defaults to `http://localhost:8000/api`. To change it, create `.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
```

## Demo credentials

The seeded accounts use password:

```text
demo1234
```

The existing UI verification OTP is still:

```text
0000
```

The OTP is intentionally a demo UI flow. For production, connect `/api/auth` to an SMS service such as an approved OTP provider and remove the hard-coded `0000` flow.

## Database configuration

Default:

```env
DATABASE_URL=sqlite:///./data/prtc.db
```

For PostgreSQL, install a PostgreSQL SQLAlchemy driver (for example `psycopg[binary]`) and set:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
```

Also set a strong production secret:

```env
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-bytes
```

## Important production hardening

Before a real public/government deployment, add server-side role authorization to every admin action, a real SMS/email OTP provider, encrypted/secured Aadhaar document storage, Aadhaar masking/tokenization, audit logs, CSRF/rate limiting as appropriate, HTTPS, backups, migrations (Alembic), and payment-gateway signature verification.
