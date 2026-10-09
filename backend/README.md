# SafrSaathi Python Backend

FastAPI + SQLAlchemy backend for the SafrSaathi PRTC frontend. SQLite is the zero-config default; set `DATABASE_URL` to a PostgreSQL SQLAlchemy URL for production.

## Python support

Designed for **Python 3.14** and current Python 3.x releases supported by FastAPI/Pydantic. The requirements intentionally use compatible version ranges so pip can install prebuilt wheels instead of forcing a local Rust compilation of `pydantic-core`.

## Run on Windows / PowerShell

```powershell
cd backend
py -3.14 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m app.seed
python -m uvicorn app.main:app --reload --port 8000
```

If `py -3.14` is not available, activate the Python 3.14 environment you already created and continue with the `python -m pip ...` commands.

API docs: http://localhost:8000/docs

## Frontend

From the project root, in a second terminal:

```powershell
npm install
npm run dev
```

Open http://localhost:5173

## Demo

Seeded demo accounts use password `demo1234`. Frontend OTP remains `0000` because it is a UI demo; replace it with a real SMS OTP provider before production.

## Production configuration

Use PostgreSQL instead of SQLite for deployment, set `ENVIRONMENT=production`,
and provide a random `JWT_SECRET` of at least 32 characters. SQLite files are
not suitable for ephemeral hosts such as Render free instances.

Google Sign-In requires a Web OAuth client created in Google Cloud Console. Add
the local and deployed frontend URLs as authorized JavaScript origins, then set
the same client ID in both applications:

```env
# backend/.env
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# Frontend/.env.local
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Google Sign-In can self-register students, corporate users, and passengers.
College and PRTC administrator accounts must be provisioned by the authority.
