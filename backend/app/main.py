import os, re, uuid, shutil, sys
from pathlib import Path
from typing import Any
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select
from .database import Base, engine, get_db
from .models import (User,College,StudentApplication,Ticket,TicketVerification,RouteSchedule)
from .security import hash_password, verify_password, create_token

if sys.version_info < (3, 10):
    raise RuntimeError("SafrSaathi backend requires Python 3.10 or newer.")

Base.metadata.create_all(bind=engine)
app = FastAPI(title="SafrSaathi PRTC API", version="1.0.0")
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
UPLOAD_DIR = Path("uploads"); UPLOAD_DIR.mkdir(exist_ok=True)

def camel(s: str) -> str:
    parts=s.split("_"); return parts[0]+"".join(p.capitalize() for p in parts[1:])

def serialize(obj, exclude=()):
    data={}
    for c in obj.__table__.columns:
        if c.name in exclude: continue
        key = "from" if c.name == "from_location" else "to" if c.name == "to_location" else camel(c.name)
        val=getattr(obj,c.name)
        if hasattr(val,"isoformat"): val=val.isoformat()
        data[key]=val
    return data

def apply_payload(obj, payload: dict[str, Any], protected=("id","created_at")):
    columns={c.name for c in obj.__table__.columns}
    for key,val in payload.items():
        snake=re.sub(r"(?<!^)(?=[A-Z])", "_", key).lower()
        if snake == "from": snake="from_location"
        if snake == "to": snake="to_location"
        if snake in columns and snake not in protected:
            setattr(obj,snake,val)
    return obj
def is_punjab_address(address: str | None) -> bool:
    if not address:
        return False

    return "punjab" in address.strip().lower()
def normalize_location(value: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        value.strip().lower()
    )
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

class AuthPayload(BaseModel):
    profile: dict[str, Any]
    password: str = "demo1234"
    mode: str = "login"

class LoginPayload(BaseModel):
    email: str
    password: str
    roleType: str | None = None

class GenericPayload(BaseModel):
    data: dict[str, Any]
class TicketVerificationPayload(BaseModel):
    conductorId: str
    conductorName: str | None = None
    boardingLocation: str
    destination: str

@app.get("/api/health")
def health(): return {"status":"ok"}

@app.get("/api/bootstrap")
def bootstrap(db: Session=Depends(get_db)):
    return {
        "colleges":[serialize(x) for x in db.scalars(select(College)).all()],
        "applications":[serialize(x, ("created_at",)) for x in db.scalars(select(StudentApplication).order_by(StudentApplication.created_at.desc())).all()],
        "tickets":[serialize(x, ("created_at","owner_pass_id")) for x in db.scalars(select(Ticket).order_by(Ticket.created_at.desc())).all()],
        "schedules":[serialize(x, ("id",)) for x in db.scalars(select(RouteSchedule)).all()],
    }

@app.post("/api/auth/profile")
def auth_profile(body: AuthPayload, db: Session=Depends(get_db)):
    p=body.profile; email=(p.get("email") or "").strip().lower()
    if not email: raise HTTPException(400,"Email is required")
    user=db.scalar(select(User).where(User.email==email))
    if body.mode == "register":
        if user:
            raise HTTPException(409,"An account with this email already exists")

        # Student Punjab residency validation
        if p.get("roleType") == "student":
            address = p.get("permanentAddress")

            if not is_punjab_address(address):
                raise HTTPException(
                    status_code=403,
                    detail="You are not eligible for the pass"
                )

            p["isPunjabResident"] = True
        
        pass_id=p.get("passId") or f"USR-{uuid.uuid4().hex[:8].upper()}"
        user=User(id=p.get("id") or f"usr-{uuid.uuid4().hex[:12]}", pass_id=pass_id, name=p.get("name") or email.split("@")[0], email=email, phone=p.get("phone") or "", password_hash=hash_password(body.password or "demo1234"), role_type=p.get("roleType") or "passenger", avatar_url=p.get("avatarUrl") or "")
        apply_payload(user,p,protected=("id","created_at","password_hash","email","pass_id")); user.pass_id=pass_id
        db.add(user)
    else:
        if not user:
            # Preserve demo UX: create the first login profile if it does not exist yet.
            pass_id=p.get("passId") or f"USR-{uuid.uuid4().hex[:8].upper()}"
            user=User(id=p.get("id") or f"usr-{uuid.uuid4().hex[:12]}", pass_id=pass_id, name=p.get("name") or email.split("@")[0], email=email, phone=p.get("phone") or "", password_hash=hash_password(body.password or "demo1234"), role_type=p.get("roleType") or "passenger", avatar_url=p.get("avatarUrl") or "")
            apply_payload(user,p,protected=("id","created_at","password_hash","email","pass_id")); db.add(user)
        elif user.password_hash and body.password and not verify_password(body.password,user.password_hash):
            raise HTTPException(401,"Invalid email or password")
    apply_payload(user,p,protected=("id","created_at","password_hash","email","pass_id"))
    db.commit(); db.refresh(user)
    return {"profile":serialize(user,("password_hash","created_at","last_login_at")), "accessToken":create_token(user.id,user.role_type)}

@app.put("/api/users/{pass_id}")
def update_user(pass_id: str, body: GenericPayload, db: Session=Depends(get_db)):
    user=db.scalar(select(User).where(User.pass_id==pass_id))
    if not user:
        raise HTTPException(404,"User not found")
    if user.role_type == "student":
        new_address = body.data.get("permanentAddress")

        if new_address is not None:
            if not is_punjab_address(new_address):
                raise HTTPException(
                    status_code=403,
                    detail="You are not eligible for the pass"
                )

            body.data["isPunjabResident"] = True
    apply_payload(user,body.data,protected=("id","created_at","password_hash","pass_id")); db.commit(); db.refresh(user)
    return serialize(user,("password_hash","created_at","last_login_at"))

@app.get("/api/applications")
def list_apps(db: Session=Depends(get_db)): return [serialize(x,("created_at",)) for x in db.scalars(select(StudentApplication).order_by(StudentApplication.created_at.desc())).all()]

@app.post("/api/applications")
def create_app(body: GenericPayload, db: Session=Depends(get_db)):
    p=body.data; app_id=p.get("id") or f"app-{uuid.uuid4().hex[:10]}"
    if db.get(StudentApplication,app_id): raise HTTPException(409,"Application already exists")
    obj=StudentApplication(id=app_id, student_id=p.get("studentId") or "", name=p.get("name") or "", initials=p.get("initials") or "", college_id=p.get("collegeId") or "", college_name=p.get("collegeName") or "", roll_number=p.get("rollNumber") or "", course=p.get("course") or "", semester=p.get("semester") or "", pass_type=p.get("passType") or "", route=p.get("route") or "", status=p.get("status") or "pending", submitted_date=p.get("submittedDate") or "", aadhaar_number=p.get("aadhaarNumber") or "")
    apply_payload(obj,p); db.add(obj); db.commit(); db.refresh(obj); return serialize(obj,("created_at",))

@app.put("/api/applications/{app_id}")
def update_app(app_id: str, body: GenericPayload, db: Session=Depends(get_db)):
    obj=db.get(StudentApplication,app_id)
    if not obj: raise HTTPException(404,"Application not found")
    apply_payload(obj,body.data); db.commit(); db.refresh(obj); return serialize(obj,("created_at",))

@app.get("/api/tickets")
def list_tickets(db: Session=Depends(get_db)): return [serialize(x,("created_at","owner_pass_id")) for x in db.scalars(select(Ticket).order_by(Ticket.created_at.desc())).all()]

@app.post("/api/tickets")
def create_ticket(body: GenericPayload, db: Session=Depends(get_db)):
    p=body.data; ticket_id=p.get("id") or f"tkt-{uuid.uuid4().hex[:10]}"
    obj=Ticket(id=ticket_id, owner_pass_id=p.get("ownerPassId"), ticket_number=p.get("ticketNumber") or f"PRTC-{uuid.uuid4().hex[:8].upper()}", title=p.get("title") or "PRTC Ticket", type=p.get("type") or "single", route=p.get("route") or "", timestamp=p.get("timestamp") or "Just now", amount=float(p.get("amount") or 0), status=p.get("status") or "active")
    apply_payload(obj,p); db.add(obj); db.commit(); db.refresh(obj); return serialize(obj,("created_at","owner_pass_id"))

@app.post("/api/tickets/{ticket_number}/verify")
def verify_ticket(
    ticket_number: str,
    body: TicketVerificationPayload,
    db: Session = Depends(get_db)
):
    ticket = db.scalar(
        select(Ticket).where(
            Ticket.ticket_number == ticket_number
        )
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Frozen / already completed ticket
    if ticket.status == "expired":
        raise HTTPException(
            status_code=409,
            detail="This ticket has already reached its final destination and cannot be reused"
        )

    final_destination = get_final_destination(ticket.route)

    if not final_destination:
        raise HTTPException(
            status_code=400,
            detail="Ticket has no valid final destination"
        )

    verification = TicketVerification(
        ticket_id=ticket.id,
        conductor_id=body.conductorId,
        conductor_name=body.conductorName,
        boarding_location=body.boardingLocation,
        entered_destination=body.destination,
    )

    db.add(verification)

    reached_final_destination = (
        normalize_location(body.destination)
        == normalize_location(final_destination)
    )

    # Freeze ticket when final destination is reached
    if reached_final_destination:
        ticket.status = "expired"

    d55b.commit()
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
    db: Session = Depends(get_db)
):
    ticket = db.scalar(
        select(Ticket).where(
            Ticket.ticket_number == ticket_number
        )
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    entries = db.scalars(
        select(TicketVerification)
        .where(
            TicketVerification.ticket_id == ticket.id
        )
        .order_by(TicketVerification.verified_at.asc())
    ).all()

    return {
        "ticketNumber": ticket.ticket_number,
        "route": ticket.route,
        "status": ticket.status,
        "frozen": ticket.status == "expired",
        "entries": [
            serialize(entry)
            for entry in entries
        ],
    }
@app.get("/api/schedules")
def schedules(db: Session=Depends(get_db)): return [serialize(x,("id",)) for x in db.scalars(select(RouteSchedule)).all()]

@app.post("/api/documents")
def upload_document(file: UploadFile=File(...)):
    suffix=Path(file.filename or "upload.bin").suffix.lower()
    if suffix not in {".pdf",".png",".jpg",".jpeg",".webp"}: raise HTTPException(400,"Only PDF and image documents are allowed")
    name=f"{uuid.uuid4().hex}{suffix}"; dest=UPLOAD_DIR/name
    with dest.open("wb") as out: shutil.copyfileobj(file.file,out)
    return {"fileName":name,"originalName":file.filename}
