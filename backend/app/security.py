import os, hashlib, hmac, secrets
from datetime import datetime, timedelta, timezone
import jwt

SECRET = os.getenv("JWT_SECRET", "dev-only-change-me")
ALGORITHM = "HS256"
TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "1440"))

if os.getenv("ENVIRONMENT", "development").lower() == "production" and len(SECRET) < 32:
    raise RuntimeError("JWT_SECRET must be at least 32 characters in production")

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 210_000).hex()
    return f"pbkdf2_sha256${salt}${digest}"

def verify_password(password: str, encoded: str) -> bool:
    try:
        _, salt, expected = encoded.split("$", 2)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 210_000).hex()
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False

def create_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": user_id, "role": role, "iat": now, "exp": now + timedelta(minutes=TOKEN_MINUTES)}
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """Validate an access token and return its claims.

    Keeping this in one place ensures every protected endpoint uses the same
    expiry, signature and algorithm checks.
    """
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise ValueError("Invalid or expired access token") from exc

def create_qr_token(subject: str, kind: str, expires_at: datetime) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "kind": kind,
        "iat": now,
        "exp": expires_at,
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)
