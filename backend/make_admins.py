"""Create or repair the demo admin logins (password: demo1234).

Run from the backend folder with the virtual environment active:
    python make_admins.py
"""
from app.database import SessionLocal
from app.models import User
from app.security import hash_password

PASSWORD = "demo1234"

# id, pass_id, name, email, role, institution, college_id
ADMINS = [
    ("usr-college-01", "PEC-ADMIN-01", "Dr. S. Kapoor", "deansw@pec.edu.in",
     "college_admin", "Punjab Engineering College (PEC)", "pec"),
    ("usr-prtc-01", "PRTC-PAT-HQ-091", "S. Gurmukh Singh", "g.singh@prtc.punjab.gov.in",
     "prtc_admin", "Pepsu Road Transport Corporation", None),
]

db = SessionLocal()
try:
    for uid, pass_id, name, email, role, institution, college_id in ADMINS:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(
                id=uid, pass_id=pass_id, name=name, email=email, phone="",
                password_hash=hash_password(PASSWORD), role_type=role,
                avatar_url="", institution=institution,
            )
            db.add(user)
            action = "created"
        else:
            action = "updated"
        user.password_hash = hash_password(PASSWORD)
        user.role_type = role
        user.college_id = college_id
        print(f"{action}: {email}  role={role}  college_id={college_id}")
    db.commit()

    print("\nAll users now in the database:")
    for u in db.query(User).all():
        print(f"  {u.email:40} {u.role_type:14} college_id={u.college_id}")
finally:
    db.close()