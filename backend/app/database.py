import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Always resolve database path relative to the backend directory, so it works
# regardless of whether uvicorn is launched from repo root or the backend folder.
BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

DEFAULT_DB_FILE = (BACKEND_DIR / "data" / "prtc.db").resolve()
DEFAULT_DB_FILE.parent.mkdir(parents=True, exist_ok=True)
DEFAULT_SQLITE_URL = f"sqlite:///{DEFAULT_DB_FILE.as_posix()}"

raw_url = os.getenv("DATABASE_URL", "").strip()
environment = os.getenv("ENVIRONMENT", "development").strip().lower()

# Render's local filesystem is ephemeral.  Failing fast in production is safer
# than silently creating a SQLite database whose users and issued passes vanish
# at the next restart.
if not raw_url and environment in {"production", "prod"}:
    raise RuntimeError("DATABASE_URL must point to persistent PostgreSQL in production")

if not raw_url:
    DATABASE_URL = DEFAULT_SQLITE_URL
elif raw_url.startswith("sqlite:///./"):
    rel_path = raw_url[len("sqlite:///./"):]
    db_path = (BACKEND_DIR / rel_path).resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    DATABASE_URL = f"sqlite:///{db_path.as_posix()}"
else:
    # Supabase commonly supplies postgres:// or postgresql:// URLs.  This
    # project ships psycopg v3, so make the SQLAlchemy driver explicit.
    if raw_url.startswith("postgres://"):
        raw_url = "postgresql://" + raw_url[len("postgres://"):]
    if raw_url.startswith("postgresql://"):
        raw_url = "postgresql+psycopg://" + raw_url[len("postgresql://"):]
    DATABASE_URL = raw_url
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_columns():
    """Ensure missing columns like pass_issued_at and pass_expires_at exist on student_applications."""
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if "student_applications" in inspector.get_table_names():
        existing_cols = {c["name"] for c in inspector.get_columns("student_applications")}
        with engine.begin() as conn:
            if "pass_issued_at" not in existing_cols:
                conn.execute(text("ALTER TABLE student_applications ADD COLUMN pass_issued_at TIMESTAMP"))
            if "pass_expires_at" not in existing_cols:
                conn.execute(text("ALTER TABLE student_applications ADD COLUMN pass_expires_at TIMESTAMP"))
