import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.database import SessionLocal, Base, engine
from app.models import User, StudentApplication
from app.main import create_app, update_app, application_qr, verify_student_pass, GenericPayload, QrVerificationPayload

def test_full_pipeline_direct():
    print("=== STARTING BACKEND DIRECT E2E TESTS ===")
    db = SessionLocal()
    try:
        # 1. Fetch Actors
        student = db.query(User).filter(User.role_type == "student", User.email.like("%prakash%")).first()
        if not student:
            student = db.query(User).filter(User.role_type == "student").first()
        assert student is not None, "Student user must exist"

        cgc_admin = db.query(User).filter(User.role_type == "college_admin", User.college_id == "ccet").first()
        assert cgc_admin is not None, "CGC Admin user must exist"

        prtc_admin = db.query(User).filter(User.role_type == "prtc_admin").first()
        assert prtc_admin is not None, "PRTC Admin user must exist"

        print(f"  [OK] Found actors - Student ({student.name}), College Admin ({cgc_admin.name}), PRTC Admin ({prtc_admin.name})")

        # 2. Cleanup any prior test app
        test_app_id = "app-test-prakash-8888"
        prior = db.get(StudentApplication, test_app_id)
        if prior:
            db.delete(prior)
            db.commit()

        # 3. Student creates application
        app_payload = GenericPayload(data={
            "id": test_app_id,
            "name": student.name,
            "initials": "PK",
            "collegeId": "ccet",
            "collegeName": "Chandigarh Engineering College-CGC Landran",
            "rollNumber": student.roll_no or "2554887",
            "course": "B.Tech Computer Science & Engg",
            "semester": "Semester 4",
            "passType": "Subsidized Student Concession",
            "route": "Kharar Bus Stand -> CGC Landran Mohali Campus",
            "status": "pending",
            "aadhaarNumber": "XXXX-XXXX-9987",
        })

        created = create_app(body=app_payload, db=db, actor=student)
        assert created["status"] == "pending", f"Expected pending, got {created['status']}"
        print("  [OK] Student application created with status 'pending'")

        # 4. College Admin approves and applies virtual stamp
        stamp_payload = GenericPayload(data={
            "status": "college_approved",
            "collegeVerifiedBy": "DR. D. SHARMA (DEAN / REGISTRAR)",
            "collegeVerifiedDate": "04 Nov 2026",
            "collegeStampId": "SEAL-CGC-8888",
            "collegeStampName": "Official Seal of CGC Landran",
        })
        stamped = update_app(app_id=test_app_id, body=stamp_payload, db=db, actor=cgc_admin)
        assert stamped["status"] == "college_approved"
        assert stamped["collegeStampId"] == "SEAL-CGC-8888"
        print("  [OK] College Admin approved and applied virtual stamp ('college_approved')")

        # 5. PRTC Admin sanctions pass
        prtc_payload = GenericPayload(data={
            "status": "approved",
            "prtcVerifiedBy": "S. GURMUKH SINGH (DEPOT SUPT.)",
            "prtcVerifiedDate": "04 Nov 2026",
            "prtcAdminId": "PRTC-PAT-HQ-091",
            "collegeStampId": "SEAL-CGC-8888",
        })
        sanctioned = update_app(app_id=test_app_id, body=prtc_payload, db=db, actor=prtc_admin)
        assert sanctioned["status"] == "approved"
        assert sanctioned["collegeStampId"] == "SEAL-CGC-8888"
        assert sanctioned["prtcAdminId"] == "PRTC-PAT-HQ-091"
        print("  [OK] PRTC Admin sanctioned pass ('approved') with college stamp preserved")

        # 6. Conductor QR generation
        qr_res = application_qr(app_id=test_app_id, db=db, actor=student)
        assert "token" in qr_res
        token = qr_res["token"]
        assert len(token) > 20
        print("  [OK] Live Conductor QR token generated")

        # 7. Verification by Conductor
        verify_payload = QrVerificationPayload(token=token, tripRoute="Kharar Bus Stand -> CGC Landran Mohali Campus")
        verify_res = verify_student_pass(body=verify_payload, db=db, actor=None)
        assert verify_res["valid"] is True
        print(f"  [OK] Conductor verified pass for {verify_res['holderName']} ({verify_res['collegeName']})")

        # 8. Teardown
        final_obj = db.get(StudentApplication, test_app_id)
        if final_obj:
            db.delete(final_obj)
            db.commit()
        print("  [OK] Teardown complete")

        print("\n=== ALL BACKEND DIRECT E2E TESTS PASSED ===")
    finally:
        db.close()

if __name__ == "__main__":
    test_full_pipeline_direct()
