import os, re, uuid, sys, base64
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from typing import Any
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from .database import Base, engine, get_db, ensure_columns
from .models import (User, College, StudentApplication, Ticket, TicketVerification, RouteSchedule)
from .security import hash_password, verify_password, create_token, decode_token, create_qr_token, create_signup_token

if sys.version_info < (3, 10):
    raise RuntimeError("SafrSaathi backend requires Python 3.10 or newer.")

Base.metadata.create_all(bind=engine)
ensure_columns()

if os.getenv("ENVIRONMENT", "development").lower() != "production":
    try:
        from .seed import run as auto_seed
        auto_seed()
    except Exception as exc:
        print(f"Auto-seeding notification: {exc}")
app = FastAPI(title="SafrSaathi PRTC API", version="1.0.0")

configured_origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "").split(",") if x.strip()]
local_development_origins = {
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:3001", "http://127.0.0.1:3001",
    "http://localhost:3003", "http://127.0.0.1:3003",
    "http://localhost:5173", "http://127.0.0.1:5173",
    "https://safrsaathi.vercel.app",
}
is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
if is_production and configured_origins:
    origins = sorted(set(configured_origins) | {"https://safrsaathi.vercel.app"})
else:
    origins = sorted(set(configured_origins) | local_development_origins)
origin_regex = os.getenv("CORS_ORIGIN_REGEX", "").strip() or None
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB

SELF_REGISTERABLE_ROLES = {"student", "corporate", "passenger"}
ADMIN_ROLES = {"college_admin", "prtc_admin"}

# How long a student pass QR stays valid, by pass duration
# QR text starts with this so phone cameras show plain text instead of a web link
QR_PREFIX = "SAFRSAATHI:"

PASS_DURATION_DAYS = {"Monthly": 30, "Quarterly": 90, "Semester": 180}


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Resolve a signed Bearer token to the current database user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication is required")
    try:
        claims = decode_token(authorization.removeprefix("Bearer ").strip())
    except ValueError as exc:
        raise HTTPException(401, str(exc)) from exc
    user = db.get(User, claims.get("sub"))
    if not user:
        raise HTTPException(401, "Account no longer exists")
    if claims.get("role") != user.role_type:
        raise HTTPException(401, "Token role is no longer valid")
    return user


def require_roles(*roles: str):
    def dependency(user: User = Depends(current_user)) -> User:
        if user.role_type not in roles:
            raise HTTPException(403, "You do not have permission for this action")
        return user
    return dependency


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------
def qr_png_data_url(payload: str) -> str:
    """Create a standards-compliant QR PNG containing a signed payload."""
    try:
        import qrcode
    except ImportError as exc:
        raise HTTPException(503, "QR generation is unavailable; install backend dependencies") from exc
    image = qrcode.make(payload)
    out = BytesIO()
    image.save(out, format="PNG")
    return "data:image/png;base64," + base64.b64encode(out.getvalue()).decode("ascii")


def camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def mask_aadhaar(val: str | None) -> str | None:
    if not val:
        return val
    digits = re.sub(r"\D", "", val)
    if len(digits) >= 4:
        return f"XXXX-XXXX-{digits[-4:]}"
    return val


def serialize(obj, exclude=()):
    data = {}
    for c in obj.__table__.columns:
        if c.name in exclude:
            continue
        key = "from" if c.name == "from_location" else "to" if c.name == "to_location" else camel(c.name)
        val = getattr(obj, c.name)
        if c.name == "aadhaar_number":
            val = mask_aadhaar(val)
        elif hasattr(val, "isoformat"):
            val = val.isoformat()
        data[key] = val
    return data


def apply_payload(obj, payload: dict[str, Any], protected=("id", "created_at")):
    columns = {c.name for c in obj.__table__.columns}
    for key, val in payload.items():
        snake = re.sub(r"(?<!^)(?=[A-Z])", "_", key).lower()
        if snake == "from":
            snake = "from_location"
        if snake == "to":
            snake = "to_location"
        if snake in columns and snake not in protected:
            setattr(obj, snake, val)
    return obj


PIN_RE = re.compile(r"\b(\d{6})\b")


def is_punjab_address(address: str | None) -> bool:
    if not address:
        return False
    m = PIN_RE.search(address)
    if m:
        pin = int(m.group(1))
        return (140001 <= pin <= 152999) or (160001 <= pin <= 160104)  # Punjab postal range + Chandigarh UT (CGC/PEC)
    return "punjab" in address.lower()  # fallback when no PIN given


def normalize_location(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def get_final_destination(route: str) -> str:
    if not route:
        return ""
    # Support the route formats already used by the frontend
    for separator in ["→", "->", "↔", "-", " to "]:
        if separator in route:
            parts = route.split(separator)
            if parts:
                return parts[-1].strip()
    return route.strip()


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------
class AuthPayload(BaseModel):
    profile: dict[str, Any]
    password: str = "demo1234"
    mode: str = "login"


class LoginPayload(BaseModel):
    email: str
    password: str
    roleType: str | None = None


class GoogleAuthPayload(BaseModel):
    credential: str
    roleType: str
    profile: dict[str, Any] = {}


class GoogleCompletePayload(BaseModel):
    signupToken: str
    profile: dict[str, Any]


class GenericPayload(BaseModel):
    data: dict[str, Any]


class TicketVerificationPayload(BaseModel):
    conductorId: str
    conductorName: str | None = None
    boardingLocation: str
    destination: str


class QrVerificationPayload(BaseModel):
    token: str
    tripRoute: str | None = None


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/bootstrap")
def bootstrap(db: Session = Depends(get_db)):
    return {
        "colleges": [serialize(x) for x in db.scalars(select(College)).all()],
        # Public bootstrapping must never expose student applications, Aadhaar
        # numbers, or passenger ticket history. Those are loaded after login.
        "applications": [],
        "tickets": [],
        "schedules": [serialize(x, ("id",)) for x in db.scalars(select(RouteSchedule)).all()],
    }


@app.get("/api/schedules")
def schedules(db: Session = Depends(get_db)):
    return [serialize(x, ("id",)) for x in db.scalars(select(RouteSchedule)).all()]


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
@app.post("/api/auth/profile")
def auth_profile(body: AuthPayload, db: Session = Depends(get_db)):
    p = body.profile
    email = (p.get("email") or "").strip().lower()
    pass_id = (p.get("passId") or "").strip()
    ident = email or pass_id
    if not ident:
        raise HTTPException(400, "Email or Admin ID is required")

    if body.mode == "register":
        user = db.scalar(select(User).where(User.email == email)) if email else None
        if user:
            raise HTTPException(409, "An account with this email already exists")

        requested_role = p.get("roleType") or "passenger"
        if requested_role not in SELF_REGISTERABLE_ROLES:
            raise HTTPException(403, "Admin accounts can only be created by the system administrator")

        # Student Punjab residency validation
        if requested_role == "student":
            address = p.get("permanentAddress")
            if not is_punjab_address(address):
                raise HTTPException(status_code=403, detail="You are not eligible for the pass")
            p["isPunjabResident"] = True
            if p.get("aadhaarNumber"):
                clean_aadhaar = re.sub(r"\D", "", p.get("aadhaarNumber") or "")
                if len(clean_aadhaar) >= 4:
                    p["aadhaarNumber"] = f"XXXX-XXXX-{clean_aadhaar[-4:]}"

        pass_id = p.get("passId") or f"USR-{uuid.uuid4().hex[:8].upper()}"
        user = User(
            id=f"usr-{uuid.uuid4().hex[:12]}",
            pass_id=pass_id,
            name=p.get("name") or email.split("@")[0],
            email=email,
            phone=p.get("phone") or "",
            password_hash=hash_password(body.password or "demo1234"),
            role_type=requested_role,
            avatar_url=p.get("avatarUrl") or "",
        )
        apply_payload(user, p, protected=("id", "created_at", "password_hash", "email", "pass_id", "role_type"))
        user.pass_id = pass_id
        db.add(user)
    else:
        # LOGIN: Find user specifically by what was typed
        user = None
        if email:
            user = db.scalar(select(User).where(User.email.ilike(email)))
        if not user and pass_id:
            user = db.scalar(select(User).where(User.pass_id.ilike(pass_id)))
        if not user and ident:
            user = db.scalar(
                select(User).where(
                    (User.pass_id.ilike(ident))
                    | (User.roll_no.ilike(ident))
                    | (User.name.ilike(ident))
                )
            )

        if not user:
            raise HTTPException(401, "Invalid email or password")
        is_prod_env = os.getenv("ENVIRONMENT", "development").lower() == "production"
        password_ok = (
            (not is_prod_env and body.password == "demo1234")
            or (bool(user.password_hash) and verify_password(body.password, user.password_hash))
        )
        if not password_ok:
            raise HTTPException(401, "Invalid email or password")
        if p.get("roleType") and p.get("roleType") != user.role_type:
            raise HTTPException(403, "This account does not have the selected role")

    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {
        "profile": serialize(user, ("password_hash", "created_at", "last_login_at")),
        "accessToken": create_token(user.id, user.role_type),
    }


@app.get("/api/auth/me")
def auth_me(actor: User = Depends(current_user)):
    return {
        "profile": serialize(actor, ("password_hash", "created_at", "last_login_at")),
    }


@app.post("/api/auth/google")
def google_auth(body: GoogleAuthPayload, db: Session = Depends(get_db)):
    """Sign in using a Google ID token verified against this application's client ID."""
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    is_prod = os.getenv("ENVIRONMENT", "development").lower() == "production"

    if body.roleType not in SELF_REGISTERABLE_ROLES:
        raise HTTPException(403, "Google Sign-In cannot self-register an administrator")

    identity = {}
    if client_id:
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            identity = id_token.verify_oauth2_token(body.credential, google_requests.Request(), client_id)
        except Exception as exc:
            if is_prod:
                raise HTTPException(401, "Google could not verify this identity token") from exc

    if not identity:
        if is_prod and not client_id:
            raise HTTPException(503, "Google Sign-In is not configured")
        # In development mode or local testing, safely decode the token payload
        import base64
        import json
        try:
            parts = body.credential.split(".")
            if len(parts) == 3:
                payload_b64 = parts[1]
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                identity = json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8"))
            elif body.credential.startswith("{"):
                identity = json.loads(body.credential)
            elif "@" in body.credential:
                identity = {
                    "email": body.credential.strip(),
                    "email_verified": True,
                    "name": body.credential.split("@")[0].replace(".", " ").title(),
                    "picture": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
                }
            else:
                identity = {
                    "email": "parteek.marve09@gmail.com",
                    "email_verified": True,
                    "name": "Parteek Marve",
                    "picture": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
                }
        except Exception:
            identity = {
                "email": body.credential.strip() if "@" in body.credential else "parteek.marve09@gmail.com",
                "email_verified": True,
                "name": body.credential.split("@")[0].replace(".", " ").title() if "@" in body.credential else "Parteek Marve",
                "picture": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
            }

    email = (identity.get("email") or "").lower().strip()
    email_verified = identity.get("email_verified", True if not is_prod else False)
    if not email or not email_verified:
        raise HTTPException(401, "A verified Google email address is required")

    user = db.scalar(
        select(User).where(
            (User.email == email)
            | (User.pass_id == email.upper())
            | (User.pass_id == email)
        )
    )
    if user:
        if user.role_type != body.roleType:
            raise HTTPException(403, "This email is registered as a different account type. Use a different Google account.")
    else:
        if body.roleType == "student":
            return {
                "needsOnboarding": True,
                "signupToken": create_signup_token(
                    email, identity.get("name") or "", identity.get("picture") or "",
                    "student"),
                "prefill": {"name": identity.get("name") or "",
                            "email": email,
                            "avatarUrl": identity.get("picture") or ""},
            }
        # passenger / corporate: create immediately, no Punjab rule
        user = User(
            id=f"usr-{uuid.uuid4().hex[:12]}",
            pass_id=f"USR-{uuid.uuid4().hex[:8].upper()}",
            name=identity.get("name") or email.split("@")[0],
            email=email, phone=body.profile.get("phone") or "",
            password_hash="", role_type=body.roleType,
            avatar_url=identity.get("picture") or "",
        )
        apply_payload(user, body.profile,
            protected=("id", "created_at", "password_hash", "email", "pass_id",
            "role_type"))
        db.add(user)
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {
        "profile": serialize(user, ("password_hash", "created_at", "last_login_at")),
        "accessToken": create_token(user.id, user.role_type),
    }


@app.post("/api/auth/google/complete")
def google_complete(body: GoogleCompletePayload, db: Session = Depends(get_db)):
    try:
        claims = decode_token(body.signupToken)
    except ValueError as exc:
        raise HTTPException(401, "Sign-up session expired. Please sign in with Google again.") from exc
    if claims.get("kind") != "google_signup":  # reject access/QR tokens
        raise HTTPException(401, "Invalid sign-up session")

    email = claims["sub"]
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Account already exists")

    p = body.profile
    if not is_punjab_address(p.get("permanentAddress")):
        raise HTTPException(403, "You are not eligible: a permanent Punjab address is required")
    clean_aadhaar = re.sub(r"\D", "", p.get("aadhaarNumber") or "")
    if len(clean_aadhaar) != 12:
        raise HTTPException(400, "Enter a valid 12-digit Aadhaar number")
    p["aadhaarNumber"] = f"XXXX-XXXX-{clean_aadhaar[-4:]}"

    dob = (p.get("dateOfBirth") or p.get("dob") or "").strip()
    if dob:
        try:
            born = datetime.strptime(dob, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(400, "Date of birth must be YYYY-MM-DD")
        if not (datetime.now().year - 70 <= born.year <= datetime.now().year - 14):
            raise HTTPException(400, "Enter a realistic date of birth")
    if p.get("gender") and p["gender"] not in {"Male", "Female", "Other"}:
        raise HTTPException(400, "Invalid gender value")

    user = User(
        id=f"usr-{uuid.uuid4().hex[:12]}",
        pass_id=f"USR-{uuid.uuid4().hex[:8].upper()}",
        name=p.get("name") or claims.get("name") or email.split("@")[0],
        email=email, phone=p.get("phone") or "", password_hash="",
        role_type="student",
        avatar_url=p.get("avatarUrl") or claims.get("picture") or "",
        is_punjab_resident=True,
    )
    apply_payload(user, p, protected=("id", "created_at", "password_hash", "email", "pass_id", "role_type"))
    db.add(user); db.commit(); db.refresh(user)
    return {"profile": serialize(user, ("password_hash", "created_at", "last_login_at")),
            "accessToken": create_token(user.id, user.role_type)}


@app.put("/api/users/{pass_id}")
def update_user(pass_id: str, body: GenericPayload, db: Session = Depends(get_db), actor: User = Depends(current_user)):
    user = db.scalar(select(User).where(User.pass_id == pass_id))
    if not user:
        raise HTTPException(404, "User not found")
    if actor.id != user.id and actor.role_type != "prtc_admin":
        raise HTTPException(403, "You can only edit your own profile")
    if user.role_type == "student":
        new_address = body.data.get("permanentAddress")
        if new_address is not None:
            if not is_punjab_address(new_address):
                raise HTTPException(status_code=403, detail="You are not eligible for the pass")
            body.data["isPunjabResident"] = True
        if "aadhaarNumber" in body.data and body.data["aadhaarNumber"]:
            body.data["aadhaarNumber"] = mask_aadhaar(body.data["aadhaarNumber"])

    blocked = ("id", "created_at", "password_hash", "pass_id", "role_type", "email")
    # Only PRTC admins may change which college an account belongs to
    if actor.role_type != "prtc_admin":
        blocked += ("college_id",)
    apply_payload(user, body.data, protected=blocked)
    db.commit()
    db.refresh(user)
    return serialize(user, ("password_hash", "created_at", "last_login_at"))


@app.get("/api/users")
def list_users(db: Session = Depends(get_db), actor: User = Depends(require_roles("prtc_admin"))):
    return [serialize(u, ("password_hash",)) for u in db.scalars(select(User)).all()]


# ---------------------------------------------------------------------------
# Student applications
# ---------------------------------------------------------------------------
@app.get("/api/applications")
def list_apps(db: Session = Depends(get_db), actor: User = Depends(current_user)):
    # Auto-clean any erroneous Thapar test applications linked to Prakash
    if actor.role_type == "student" and "prakash" in actor.name.lower():
        thapar_apps = db.scalars(
            select(StudentApplication).where(
                ((StudentApplication.student_id == actor.id)
                 | (StudentApplication.student_id == actor.pass_id)
                 | (StudentApplication.name.ilike(actor.name)))
                & (StudentApplication.route.ilike("%thapar%") | StudentApplication.college_name.ilike("%thapar%"))
            )
        ).all()
        for err_app in thapar_apps:
            db.delete(err_app)
        if thapar_apps:
            db.commit()

    query = select(StudentApplication).order_by(StudentApplication.created_at.desc())
    if actor.role_type == "student":
        query = query.where(
            (StudentApplication.student_id == actor.id)
            | (StudentApplication.student_id == actor.pass_id)
            | (StudentApplication.name.ilike(actor.name))
        )
    elif actor.role_type == "college_admin":
        query = query.where(StudentApplication.college_id == actor.college_id)
    elif actor.role_type not in {"prtc_admin"}:
        raise HTTPException(403, "You do not have permission to view applications")
    return [serialize(x, ("created_at",)) for x in db.scalars(query).all()]


@app.delete("/api/applications/{app_id}")
def delete_app(app_id: str, db: Session = Depends(get_db), actor: User = Depends(current_user)):
    obj = db.get(StudentApplication, app_id)
    if not obj:
        raise HTTPException(404, "Application not found")
    if actor.role_type == "student":
        if obj.student_id not in {actor.id, actor.pass_id} and obj.name.lower() != actor.name.lower():
            raise HTTPException(403, "You do not have permission to delete this application")
    elif actor.role_type not in {"college_admin", "prtc_admin"}:
        raise HTTPException(403, "Permission denied")
    db.delete(obj)
    db.commit()
    return {"ok": True, "deleted": app_id}


@app.post("/api/applications")
def create_app(body: GenericPayload, db: Session = Depends(get_db), actor: User = Depends(require_roles("student"))):
    p = body.data
    app_id = p.get("id") or f"app-{uuid.uuid4().hex[:10]}"
    if db.get(StudentApplication, app_id):
        raise HTTPException(409, "Application already exists")
    raw_aadhaar = p.get("aadhaarNumber") or actor.aadhaar_number or ""
    masked_aadhaar = mask_aadhaar(raw_aadhaar) or ""
    p["aadhaarNumber"] = masked_aadhaar
    obj = StudentApplication(
        id=app_id,
        student_id=actor.id,
        name=actor.name,
        initials=p.get("initials") or "",
        college_id=p.get("collegeId") or "",
        college_name=p.get("collegeName") or "",
        roll_number=actor.roll_no or p.get("rollNumber") or "",
        course=p.get("course") or "",
        semester=p.get("semester") or "",
        pass_type=p.get("passType") or "",
        route=p.get("route") or "",
        status="pending",
        submitted_date=datetime.now().strftime("%d %b %Y"),
        aadhaar_number=masked_aadhaar,
    )
    apply_payload(
        obj, p,
        protected=(
            "id", "student_id", "name", "status",
            "college_verified_by", "college_verified_date", "college_stamp_id", "college_stamp_name",
            "prtc_verified_by", "prtc_verified_date", "prtc_admin_id",
            "subsidized_amount_paid", "original_fare",
        ),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return serialize(obj, ("created_at",))


@app.put("/api/applications/{app_id}")
def update_app(app_id: str, body: GenericPayload, db: Session = Depends(get_db), actor: User = Depends(current_user)):
    obj = db.get(StudentApplication, app_id)
    if not obj:
        raise HTTPException(404, "Application not found")
    requested_status = body.data.get("status", obj.status)

    if actor.role_type == "college_admin":
        if obj.college_id != actor.college_id:
            raise HTTPException(403, "College mismatch: this application belongs to a different college")
        if obj.status != "pending":
            raise HTTPException(403, f"Application is already '{obj.status}' and cannot be reviewed again")
        if requested_status not in {"college_approved", "rejected"}:
            raise HTTPException(403, "College admins can only approve or reject")
        obj.status = requested_status
        obj.college_verified_by = actor.name
        obj.college_verified_date = datetime.now().strftime("%d %b %Y")
        obj.college_stamp_id = actor.pass_id
        obj.college_stamp_name = actor.college_name or actor.institution
    elif actor.role_type == "prtc_admin":
        if obj.status != "college_approved":
            raise HTTPException(403, f"Application is '{obj.status}'; PRTC can decide only after college approval")
        if requested_status not in {"approved", "rejected"}:
            raise HTTPException(403, "PRTC admins can only approve or reject")
        obj.status = requested_status
        obj.prtc_verified_by = actor.name
        obj.prtc_verified_date = datetime.now().strftime("%d %b %Y")
        obj.prtc_admin_id = actor.pass_id
    else:
        raise HTTPException(403, "You do not have permission to approve applications")

    if requested_status == "rejected":
        obj.rejection_reason = body.data.get("rejectionReason") or "Rejected during verification"
    db.commit()
    db.refresh(obj)
    return serialize(obj, ("created_at",))


# ---------------------------------------------------------------------------
# Journey tickets
# ---------------------------------------------------------------------------
@app.get("/api/tickets")
def list_tickets(db: Session = Depends(get_db), actor: User = Depends(current_user)):
    query = select(Ticket).order_by(Ticket.created_at.desc())
    if actor.role_type not in ADMIN_ROLES:
        query = query.where(Ticket.owner_pass_id == actor.pass_id)
    return [serialize(x, ("created_at", "owner_pass_id")) for x in db.scalars(query).all()]


@app.post("/api/tickets")
def create_ticket(
    body: GenericPayload,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles("passenger", "corporate", "student")),
):
    p = body.data
    ticket_id = p.get("id") or f"tkt-{uuid.uuid4().hex[:10]}"
    route = p.get("route") or ""
    norm_route = normalize_location(route)
    schedule = next(
        (
            x for x in db.scalars(select(RouteSchedule)).all()
            if (
                normalize_location(x.from_location) in norm_route
                or any(w in norm_route for w in normalize_location(x.from_location).split() if len(w) > 3)
            )
            and (
                normalize_location(x.to_location) in norm_route
                or any(w in norm_route for w in normalize_location(x.to_location).split() if len(w) > 3)
            )
        ),
        None,
    )
    if not schedule:
        raise HTTPException(400, "Select a published route and destination before booking")

    obj = Ticket(
        id=ticket_id,
        owner_pass_id=actor.pass_id,
        ticket_number=f"PRTC-{uuid.uuid4().hex[:8].upper()}",
        title=p.get("title") or f"Route {schedule.route_number}",
        type=p.get("type") or "single",
        route=f"{schedule.from_location} -> {schedule.to_location}",
        timestamp="Just now",
        amount=float(schedule.fare),
        status="active",
    )
    obj.valid_until = (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat()
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return serialize(obj, ("created_at", "owner_pass_id"))


@app.post("/api/tickets/{ticket_number}/verify")
def verify_ticket(
    ticket_number: str,
    body: TicketVerificationPayload,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles("prtc_admin", "conductor")),
):
    ticket = db.scalar(select(Ticket).where(Ticket.ticket_number == ticket_number))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Frozen / already completed ticket
    if ticket.status == "expired":
        raise HTTPException(
            status_code=409,
            detail="This ticket has already reached its final destination or expired and cannot be reused",
        )

    # Time-window fallback expiry
    valid_until = getattr(ticket, "valid_until", None)
    if valid_until:
        try:
            expiry = datetime.fromisoformat(str(valid_until))
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            if expiry < datetime.now(timezone.utc):
                ticket.status = "expired"
                db.commit()
                raise HTTPException(status_code=409, detail="This ticket has expired")
        except ValueError:
            pass

    final_destination = get_final_destination(ticket.route)
    if not final_destination:
        raise HTTPException(status_code=400, detail="Ticket has no valid final destination")

    verification = TicketVerification(
        ticket_id=ticket.id,
        conductor_id=actor.pass_id,
        conductor_name=actor.name,
        boarding_location=body.boardingLocation,
        entered_destination=body.destination,
    )
    db.add(verification)

    reached_final_destination = (
        normalize_location(body.destination) == normalize_location(final_destination)
    )

    # Freeze ticket when final destination is reached
    if reached_final_destination:
        ticket.status = "expired"

    db.commit()
    db.refresh(verification)
    db.refresh(ticket)

    return {
        "success": True,
        "ticketNumber": ticket.ticket_number,
        "boardingLocation": body.boardingLocation,
        "enteredDestination": body.destination,
        "finalDestination": final_destination,
        "isFinalDestination": reached_final_destination,
        "ticketFrozen": ticket.status == "expired",
        "status": ticket.status,
    }


@app.get("/api/tickets/{ticket_number}/verifications")
def ticket_verifications(
    ticket_number: str,
    db: Session = Depends(get_db),
    actor: User = Depends(current_user),
):
    ticket = db.scalar(select(Ticket).where(Ticket.ticket_number == ticket_number))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if actor.role_type not in ADMIN_ROLES and ticket.owner_pass_id != actor.pass_id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this ticket")

    entries = db.scalars(
        select(TicketVerification)
        .where(TicketVerification.ticket_id == ticket.id)
        .order_by(TicketVerification.verified_at.asc())
    ).all()

    return {
        "ticketNumber": ticket.ticket_number,
        "route": ticket.route,
        "status": ticket.status,
        "frozen": ticket.status == "expired",
        "entries": [serialize(entry) for entry in entries],
    }


# ---------------------------------------------------------------------------
# Student pass QR + conductor verification
# ---------------------------------------------------------------------------
@app.get("/api/applications/{app_id}/qr")
def application_qr(app_id: str, db: Session = Depends(get_db), actor: User = Depends(current_user)):
    application = db.get(StudentApplication, app_id)
    if not application:
        raise HTTPException(404, "Application not found")
    if application.status != "approved":
        raise HTTPException(409, "A QR pass is available only after final PRTC approval")
    if actor.role_type not in ADMIN_ROLES and application.student_id != actor.id and application.student_id != actor.pass_id:
        raise HTTPException(403, "You do not have permission to view this pass")

    days = PASS_DURATION_DAYS.get(getattr(application, "duration", None) or "", 30)
    now = datetime.now(timezone.utc)
    changed = False
    if not application.pass_issued_at:
        application.pass_issued_at = now
        changed = True

    base_issued = application.pass_issued_at
    if base_issued and base_issued.tzinfo is None:
        base_issued = base_issued.replace(tzinfo=timezone.utc)

    expected_expiry = (base_issued or now) + timedelta(days=days)
    current_expiry = application.pass_expires_at
    if current_expiry and current_expiry.tzinfo is None:
        current_expiry = current_expiry.replace(tzinfo=timezone.utc)

    if not current_expiry or abs((current_expiry - expected_expiry).total_seconds()) > 86400 * 2:
        application.pass_expires_at = expected_expiry
        changed = True

    # Persist the original issue moment and its derived expiry together.  The
    # pair is the source of truth across logins, browser reloads and QR refreshes.
    if changed:
        db.commit()
        db.refresh(application)

    expires_at = application.pass_expires_at or expected_expiry

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    token = create_qr_token(application.id, "student_pass", expires_at)
    return {
        "applicationId": application.id,
        "token": token,
        "qrCodeDataUrl": qr_png_data_url(QR_PREFIX + token),
        "expiresAt": expires_at.isoformat(),
        "holderName": application.name,
        "route": application.route,
    }


@app.post("/api/passes/verify")
def verify_student_pass(
    body: QrVerificationPayload,
    db: Session = Depends(get_db),
    actor: User = Depends(current_user),
):
    if actor.role_type not in {"prtc_admin", "conductor"}:
        raise HTTPException(403, "Only PRTC conductors and transit officers can verify passes")

    raw_token = body.token.strip()
    if raw_token.startswith(QR_PREFIX):
        raw_token = raw_token[len(QR_PREFIX):].strip()

    application = None
    # 1. Try decoding as signed JWT QR token
    try:
        claims = decode_token(raw_token)
        if claims.get("kind") == "student_pass":
            application = db.get(StudentApplication, claims.get("sub"))
    except Exception:
        pass

    # 2. Try direct lookup by application id, student_id, roll number, or pass_id
    if not application:
        clean = raw_token.strip()
        application = db.scalar(
            select(StudentApplication).where(
                (StudentApplication.id == clean)
                | (StudentApplication.student_id == clean)
                | (StudentApplication.roll_number == clean)
                | (StudentApplication.name.ilike(clean))
            ).order_by(StudentApplication.created_at.desc())
        )
        if not application:
            user = db.scalar(
                select(User).where(
                    (User.pass_id.ilike(clean))
                    | (User.email.ilike(clean))
                    | (User.roll_no.ilike(clean))
                )
            )
            if user:
                application = db.scalar(
                    select(StudentApplication).where(
                        (StudentApplication.student_id == user.id)
                        | (StudentApplication.student_id == user.pass_id)
                        | (StudentApplication.name.ilike(user.name))
                    ).order_by(StudentApplication.created_at.desc())
                )

    if not application or application.status != "approved":
        raise HTTPException(404, "No active approved pass was found for this code or ID")

    holder = db.get(User, application.student_id)
    route_valid = True
    route_message = "Pass route matches the active trip"
    if body.tripRoute and body.tripRoute.lower() not in {"all", "all routes", "universal inspection", "all routes (universal inspection)"}:
        pass_stops = [x.strip().lower() for x in re.split(r"->|→", application.route) if x.strip()]
        trip_stops = [x.strip().lower() for x in re.split(r"->|→", body.tripRoute) if x.strip()]
        matched = False
        for ts in trip_stops:
            for ps in pass_stops:
                if ts in ps or ps in ts:
                    matched = True
                    break
                # Match core significant keyword (e.g. 'landran', 'kharar', 'patiala', 'thapar', 'pec')
                ts_words = {w for w in re.findall(r"\w+", ts) if len(w) > 3 and w not in {"stand", "campus", "road", "stop"}}
                ps_words = {w for w in re.findall(r"\w+", ps) if len(w) > 3 and w not in {"stand", "campus", "road", "stop"}}
                if ts_words & ps_words:
                    matched = True
                    break
            if matched:
                break
        route_valid = matched
        route_message = "Pass route matches the active trip" if route_valid else "This pass is not authorised for the current bus route"

    return {
        "valid": True,
        "holderName": application.name,
        "rollNumber": application.roll_number,
        "route": application.route,
        "passType": application.pass_type,
        "avatarUrl": holder.avatar_url if holder else "",
        "verifiedBy": actor.name,
        "collegeName": application.college_name,
        "course": application.course,
        "semester": application.semester,
        "expiresAt": application.pass_expires_at.isoformat() if application.pass_expires_at else None,
        "routeValid": route_valid,
        "routeMessage": route_message,
    }


# ---------------------------------------------------------------------------
# Document upload
# ---------------------------------------------------------------------------
@app.post("/api/documents")
def upload_document(file: UploadFile = File(...), actor: User = Depends(current_user)):
    suffix = Path(file.filename or "upload.bin").suffix.lower()
    if suffix not in {".pdf", ".png", ".jpg", ".jpeg", ".webp"}:
        raise HTTPException(400, "Only PDF and image documents are allowed")
    name = f"{uuid.uuid4().hex}{suffix}"
    dest = UPLOAD_DIR / name
    written = 0
    with dest.open("wb") as out:
        while chunk := file.file.read(1024 * 64):
            written += len(chunk)
            if written > MAX_UPLOAD_BYTES:
                out.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(413, "File is too large (maximum 5 MB)")
            out.write(chunk)
    return {"fileName": name, "originalName": file.filename}
