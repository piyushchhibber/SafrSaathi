import os, re, uuid, sys, base64
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from typing import Any
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select
from .database import Base, engine, get_db, ensure_columns
from .models import (User, College, StudentApplication, Ticket, TicketVerification, RouteSchedule)
from .security import hash_password, verify_password, create_token, decode_token, create_qr_token

if sys.version_info < (3, 10):
    raise RuntimeError("SafrSaathi backend requires Python 3.10 or newer.")

Base.metadata.create_all(bind=engine)
ensure_columns()

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
origins = sorted(set(configured_origins) | local_development_origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app"),
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


def serialize(obj, exclude=()):
    data = {}
    for c in obj.__table__.columns:
        if c.name in exclude:
            continue
        key = "from" if c.name == "from_location" else "to" if c.name == "to_location" else camel(c.name)
        val = getattr(obj, c.name)
        if hasattr(val, "isoformat"):
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


def is_punjab_address(address: str | None) -> bool:
    if not address:
        return False
    return "punjab" in address.strip().lower()


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


class GenericPayload(BaseModel):
    data: dict[str, Any]


class TicketVerificationPayload(BaseModel):
    conductorId: str
    conductorName: str | None = None
    boardingLocation: str
    destination: str


class QrVerificationPayload(BaseModel):
    token: str


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
    if not email:
        raise HTTPException(400, "Email is required")
    user = db.scalar(
        select(User).where(
            (User.email == email)
            | (User.pass_id == email.upper())
            | (User.pass_id == email)
        )
    )

    if body.mode == "register":
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
        # LOGIN: a valid password is always required
        if not user:
            raise HTTPException(401, "Invalid email or password")
        if not user.password_hash or not body.password or not verify_password(body.password, user.password_hash):
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
    if not client_id:
        raise HTTPException(503, "Google Sign-In is not configured")
    if body.roleType not in SELF_REGISTERABLE_ROLES:
        raise HTTPException(403, "Google Sign-In cannot self-register an administrator")
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        identity = id_token.verify_oauth2_token(body.credential, google_requests.Request(), client_id)
    except Exception as exc:
        raise HTTPException(401, "Google could not verify this identity token") from exc
    email = (identity.get("email") or "").lower().strip()
    if not email or not identity.get("email_verified"):
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
            raise HTTPException(403, "This Google account is registered with a different role")
    else:
        profile = body.profile
        if body.roleType == "student" and not is_punjab_address(profile.get("permanentAddress")):
            raise HTTPException(403, "A Punjab permanent address is required for a student concession pass")
        user = User(
            id=f"usr-{uuid.uuid4().hex[:12]}",
            pass_id=f"USR-{uuid.uuid4().hex[:8].upper()}",
            name=identity.get("name") or email.split("@")[0],
            email=email,
            phone=profile.get("phone") or "",
            password_hash="",
            role_type=body.roleType,
            avatar_url=identity.get("picture") or profile.get("avatarUrl") or "",
        )
        apply_payload(user, profile, protected=("id", "created_at", "password_hash", "email", "pass_id", "role_type"))
        if body.roleType == "student":
            user.is_punjab_resident = True
        db.add(user)
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {
        "profile": serialize(user, ("password_hash", "created_at", "last_login_at")),
        "accessToken": create_token(user.id, user.role_type),
    }


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

    blocked = ("id", "created_at", "password_hash", "pass_id", "role_type", "email")
    # Only PRTC admins may change which college an account belongs to
    if actor.role_type != "prtc_admin":
        blocked += ("college_id",)
    apply_payload(user, body.data, protected=blocked)
    db.commit()
    db.refresh(user)
    return serialize(user, ("password_hash", "created_at", "last_login_at"))


# ---------------------------------------------------------------------------
# Student applications
# ---------------------------------------------------------------------------
@app.get("/api/applications")
def list_apps(db: Session = Depends(get_db), actor: User = Depends(current_user)):
    query = select(StudentApplication).order_by(StudentApplication.created_at.desc())
    if actor.role_type == "student":
        query = query.where(
            (StudentApplication.student_id == actor.id)
            | (StudentApplication.student_id == actor.pass_id)
        )
    elif actor.role_type == "college_admin":
        query = query.where(StudentApplication.college_id == actor.college_id)
    elif actor.role_type not in {"prtc_admin"}:
        raise HTTPException(403, "You do not have permission to view applications")
    return [serialize(x, ("created_at",)) for x in db.scalars(query).all()]


@app.post("/api/applications")
def create_app(body: GenericPayload, db: Session = Depends(get_db), actor: User = Depends(require_roles("student"))):
    p = body.data
    app_id = p.get("id") or f"app-{uuid.uuid4().hex[:10]}"
    if db.get(StudentApplication, app_id):
        raise HTTPException(409, "Application already exists")
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
        aadhaar_number=p.get("aadhaarNumber") or actor.aadhaar_number or "",
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
    actor: User = Depends(require_roles("prtc_admin")),
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
    if not application.pass_issued_at:
        application.pass_issued_at = now
    if not application.pass_expires_at:
        base_issued = application.pass_issued_at
        if base_issued and base_issued.tzinfo is None:
            base_issued = base_issued.replace(tzinfo=timezone.utc)
        application.pass_expires_at = (base_issued or now) + timedelta(days=days)
        db.commit()
        db.refresh(application)

    expires_at = application.pass_expires_at or (now + timedelta(days=days))
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
    actor: User = Depends(require_roles("prtc_admin")),
):
    raw_token = body.token.strip()
    if raw_token.startswith(QR_PREFIX):
        raw_token = raw_token[len(QR_PREFIX):]
    try:
        claims = decode_token(raw_token)
    except ValueError as exc:
        raise HTTPException(400, "The QR code is invalid or expired") from exc
    if claims.get("kind") != "student_pass":
        raise HTTPException(400, "This QR code is not a student pass")
    application = db.get(StudentApplication, claims.get("sub"))
    if not application or application.status != "approved":
        raise HTTPException(404, "No active approved pass was found")
    holder = db.get(User, application.student_id)
    return {
        "valid": True,
        "holderName": application.name,
        "rollNumber": application.roll_number,
        "route": application.route,
        "passType": application.pass_type,
        "avatarUrl": holder.avatar_url if holder else "",
        "verifiedBy": actor.name,
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
