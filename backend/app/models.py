from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    pass_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    phone: Mapped[str] = mapped_column(String, default="")
    password_hash: Mapped[str] = mapped_column(String, default="")
    role_type: Mapped[str] = mapped_column(String, index=True)
    avatar_url: Mapped[str] = mapped_column(Text, default="")
    institution: Mapped[str | None] = mapped_column(String, nullable=True)
    role_title: Mapped[str | None] = mapped_column(String, nullable=True)
    father_name: Mapped[str | None] = mapped_column(String, nullable=True)
    roll_no: Mapped[str | None] = mapped_column(String, nullable=True)
    college: Mapped[str | None] = mapped_column(String, nullable=True)
    permanent_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_punjab_resident: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    aadhaar_number: Mapped[str | None] = mapped_column(String, nullable=True)
    company_name: Mapped[str | None] = mapped_column(String, nullable=True)
    corporate_id: Mapped[str | None] = mapped_column(String, nullable=True)
    designation: Mapped[str | None] = mapped_column(String, nullable=True)
    gstin: Mapped[str | None] = mapped_column(String, nullable=True)
    college_id: Mapped[str | None] = mapped_column(String, nullable=True)
    college_name: Mapped[str | None] = mapped_column(String, nullable=True)
    designation_title: Mapped[str | None] = mapped_column(String, nullable=True)
    prtc_admin_id: Mapped[str | None] = mapped_column(String, nullable=True)
    depot_zone: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_login_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class College(Base):
    __tablename__ = "colleges"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    city: Mapped[str] = mapped_column(String)
    location: Mapped[str] = mapped_column(String)
    pending_count: Mapped[int] = mapped_column(Integer, default=0)
    status_tag: Mapped[str] = mapped_column(String)
    admin_name: Mapped[str | None] = mapped_column(String, nullable=True)
    established: Mapped[str | None] = mapped_column(String, nullable=True)

class StudentApplication(Base):
    __tablename__ = "student_applications"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    student_id: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String)
    initials: Mapped[str] = mapped_column(String)
    father_name: Mapped[str | None] = mapped_column(String, nullable=True)
    college_id: Mapped[str] = mapped_column(String, index=True)
    college_name: Mapped[str] = mapped_column(String)
    roll_number: Mapped[str] = mapped_column(String)
    course: Mapped[str] = mapped_column(String)
    semester: Mapped[str] = mapped_column(String)
    pass_type: Mapped[str] = mapped_column(String)
    route: Mapped[str] = mapped_column(Text)
    distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, index=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_date: Mapped[str] = mapped_column(String)
    college_verified_by: Mapped[str | None] = mapped_column(String, nullable=True)
    college_verified_date: Mapped[str | None] = mapped_column(String, nullable=True)
    college_stamp_id: Mapped[str | None] = mapped_column(String, nullable=True)
    college_stamp_name: Mapped[str | None] = mapped_column(String, nullable=True)
    prtc_verified_by: Mapped[str | None] = mapped_column(String, nullable=True)
    prtc_verified_date: Mapped[str | None] = mapped_column(String, nullable=True)
    prtc_admin_id: Mapped[str | None] = mapped_column(String, nullable=True)
    aadhaar_number: Mapped[str] = mapped_column(String)
    aadhaar_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_punjab_resident: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    aadhaar_file: Mapped[str | None] = mapped_column(String, nullable=True)
    fee_receipt_file: Mapped[str | None] = mapped_column(String, nullable=True)
    fee_receipt_size: Mapped[str | None] = mapped_column(String, nullable=True)
    fee_receipt_no: Mapped[str | None] = mapped_column(String, nullable=True)
    signature_affirmed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    subsidized_amount_paid: Mapped[float | None] = mapped_column(Float, nullable=True)
    original_fare: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Ticket(Base):
    __tablename__ = "tickets"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    owner_pass_id: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    ticket_number: Mapped[str] = mapped_column(String, unique=True, index=True)
    title: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)
    route: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[str] = mapped_column(String)
    amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String)
    qr_code_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    valid_until: Mapped[str | None] = mapped_column(String, nullable=True)
    company_name: Mapped[str | None] = mapped_column(String, nullable=True)
    holder_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class TicketVerification(Base):
    __tablename__ = "ticket_verifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )
    ticket_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("tickets.id"),
        index=True
    )
    conductor_id: Mapped[str] = mapped_column(
        String,
        index=True
    )
    conductor_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )
    boarding_location: Mapped[str] = mapped_column(
        String
    )
    entered_destination: Mapped[str] = mapped_column(
        String
    )
    verified_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

class RouteSchedule(Base):
    __tablename__ = "route_schedules"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_number: Mapped[str] = mapped_column(String, index=True)
    from_location: Mapped[str] = mapped_column(String)
    to_location: Mapped[str] = mapped_column(String)
    departure_time: Mapped[str] = mapped_column(String)
    arrival_time: Mapped[str] = mapped_column(String)
    bus_type: Mapped[str] = mapped_column(String)
    fare: Mapped[float] = mapped_column(Float)
    available_seats: Mapped[int] = mapped_column(Integer)
    frequency: Mapped[str] = mapped_column(String)
