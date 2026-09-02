import sys, json, re
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from backend.app.database import Base, engine, SessionLocal
from backend.app.models import College, StudentApplication, Ticket, RouteSchedule, User
from backend.app.security import hash_password

SEED = {
"colleges": [
{"id":"pec","name":"Punjab Engineering College (PEC)","city":"Chandigarh","location":"Sector 12, Chandigarh","pendingCount":4,"statusTag":"Pre-cleared","adminName":"Dr. S. Kapoor (Dean Academics)","established":"1921"},
{"id":"thapar","name":"Thapar Institute of Engg. & Technology","city":"Patiala","location":"Bhadson Road, Patiala, Punjab","pendingCount":6,"statusTag":"Awaiting Review","adminName":"Prof. R. Singla (Student Welfare)","established":"1956"},
{"id":"khalsa","name":"Khalsa College","city":"Amritsar","location":"Grand Trunk Road, Amritsar, Punjab","pendingCount":3,"statusTag":"Awaiting Review","adminName":"Dr. M. Grewal (Registrar)","established":"1892"},
{"id":"gndu","name":"Guru Nanak Dev University (GNDU)","city":"Amritsar","location":"Grand Trunk Road, Amritsar, Punjab","pendingCount":5,"statusTag":"Pre-cleared","adminName":"Dr. H. Bawa (Director Student Affairs)","established":"1969"},
{"id":"bikram","name":"Govt. Bikram College of Commerce","city":"Patiala","location":"Lower Mall Road, Patiala, Punjab","pendingCount":3,"statusTag":"Pre-cleared","adminName":"Prof. K. Sandhu (Admin Office)","established":"1945"},
{"id":"ccet","name":"Chandigarh College of Engg. & Tech (CCET)","city":"Chandigarh","location":"Sector 26, Chandigarh","pendingCount":2,"statusTag":"Pre-cleared","adminName":"Dr. D. Sharma","established":"2002"},
{"id":"pu_patiala","name":"Punjabi University","city":"Patiala","location":"NH 64, Urban Estate, Patiala, Punjab","pendingCount":4,"statusTag":"Awaiting Review","adminName":"Dr. T. S. Benipal","established":"1962"}],
"schedules":[
{"routeNumber":"PRTC-101","from":"Chandigarh ISBT 43","to":"Patiala Bus Stand","departureTime":"06:00 AM","arrivalTime":"07:15 AM","busType":"HVAC","fare":110,"availableSeats":24,"frequency":"Every 15 mins"},
{"routeNumber":"PRTC-205","from":"Patiala Bus Stand","to":"Ludhiana Bus Stand","departureTime":"07:30 AM","arrivalTime":"09:40 AM","busType":"Express","fare":155,"availableSeats":31,"frequency":"Every 30 mins"},
{"routeNumber":"PRTC-311","from":"Patiala Bus Stand","to":"Bathinda Bus Stand","departureTime":"08:10 AM","arrivalTime":"10:45 AM","busType":"Ordinary","fare":175,"availableSeats":28,"frequency":"Hourly"}]
}

def snake(k): return re.sub(r'(?<!^)(?=[A-Z])','_',k).lower()
def apply(obj,p):
    cols={c.name for c in obj.__table__.columns}
    for k,v in p.items():
        s=snake(k); s='from_location' if s=='from' else 'to_location' if s=='to' else s
        if s in cols and s not in {'id','created_at'}: setattr(obj,s,v)

def run():
    Base.metadata.create_all(engine); db=SessionLocal()
    try:
        if not db.query(College).count():
            for p in SEED['colleges']:
                o=College(id=p['id'],name=p['name'],city=p['city'],location=p['location'],status_tag=p['statusTag']); apply(o,p); db.add(o)
        if not db.query(RouteSchedule).count():
            for p in SEED['schedules']:
                o=RouteSchedule(route_number=p['routeNumber'],from_location=p['from'],to_location=p['to'],departure_time=p['departureTime'],arrival_time=p['arrivalTime'],bus_type=p['busType'],fare=p['fare'],available_seats=p['availableSeats'],frequency=p['frequency']); db.add(o)

        if not db.query(StudentApplication).count():
            apps = [
                {"id":"app-101","studentId":"STU-2024-8841","name":"Navjot Singh Dhillon","initials":"ND","fatherName":"S. Gurdeep Singh Dhillon","collegeId":"thapar","collegeName":"Thapar Institute of Engg. & Technology","rollNumber":"102203418","course":"B.Tech Computer Science & Engg","semester":"Semester 4 (2024-25)","passType":"Student AC","route":"Patiala Bus Stand -> Nabha Road -> Thapar Campus","distanceKm":18,"duration":"Semester","status":"college_approved","submittedDate":"24 Aug 2026","aadhaarNumber":"7842-9910-4821","aadhaarAddress":"Patiala, Punjab","isPunjabResident":True,"feeReceiptFile":"fee_receipt_navjot_sem4.pdf","feeReceiptNo":"TIET-REC-2026-904","aadhaarFile":"aadhaar_navjot_singh_signed.pdf","signatureAffirmed":True,"originalFare":900,"subsidizedAmountPaid":225},
                {"id":"app-102","studentId":"STU-2024-5519","name":"Gurleen Kaur Sandhu","initials":"GK","fatherName":"Harpreet Singh Sandhu","collegeId":"pec","collegeName":"Punjab Engineering College (PEC)","rollNumber":"21104019","course":"B.Tech Mechanical Engineering","semester":"Semester 5 (2024-25)","passType":"Student AC","route":"Mohali Phase 7 -> Sector 43 ISBT -> PEC Sector 12","distanceKm":22,"duration":"Semester","status":"approved","submittedDate":"15 Aug 2026","aadhaarNumber":"4451-8890-3321","aadhaarAddress":"Mohali, Punjab","isPunjabResident":True,"feeReceiptFile":"fee_receipt_gurleen_pec.pdf","feeReceiptNo":"PEC-FEES-2026-118","aadhaarFile":"aadhaar_gurleen_signed.pdf","signatureAffirmed":True,"originalFare":1100,"subsidizedAmountPaid":275},
                {"id":"app-103","studentId":"STU-2024-7712","name":"Amanpreet Verma","initials":"AV","fatherName":"Rajesh Verma","collegeId":"thapar","collegeName":"Thapar Institute of Engg. & Technology","rollNumber":"102305012","course":"B.E. Electronics & Communication","semester":"Semester 3","passType":"Student Non-AC","route":"Rajpura Colony -> Patiala Bus Stand -> Thapar","distanceKm":26,"duration":"Quarterly","status":"pending","submittedDate":"28 Aug 2026","aadhaarNumber":"9901-2241-7789","aadhaarAddress":"Rajpura, Punjab","isPunjabResident":True,"feeReceiptFile":"thapar_feereceipt_aman.pdf","feeReceiptNo":"TIET-REC-2026-871","aadhaarFile":"aadhaar_amanpreet_signed.pdf","signatureAffirmed":True,"originalFare":650,"subsidizedAmountPaid":162.5},
                {"id":"app-104","studentId":"STU-2024-3320","name":"Harmanjot Singh","initials":"HS","fatherName":"Jagjit Singh","collegeId":"khalsa","collegeName":"Khalsa College","rollNumber":"KC-BBA-045","course":"Bachelor of Business Administration","semester":"Semester 3","passType":"Student Non-AC","route":"Tarn Taran -> Amritsar GT Road Bus Stand","distanceKm":24,"duration":"Semester","status":"college_approved","submittedDate":"22 Aug 2026","aadhaarNumber":"3341-7782-9011","aadhaarAddress":"Tarn Taran, Punjab","isPunjabResident":True,"feeReceiptFile":"fee_receipt_harman.pdf","feeReceiptNo":"KC-FEE-8821","aadhaarFile":"aadhaar_harman_signed.pdf","signatureAffirmed":True,"originalFare":800,"subsidizedAmountPaid":200},
                {"id":"app-105","studentId":"STU-2024-9041","name":"Mehakpreet Kaur","initials":"MK","fatherName":"Baldev Singh","collegeId":"bikram","collegeName":"Govt. Bikram College of Commerce","rollNumber":"GBCC-BCOM-112","course":"B.Com Honours","semester":"Semester 2","passType":"Student Express","route":"Samana -> Patiala Lower Mall Bus Stop","distanceKm":30,"duration":"Semester","status":"pending","submittedDate":"27 Aug 2026","aadhaarNumber":"5561-3320-1194","aadhaarAddress":"Samana, Punjab","isPunjabResident":True,"feeReceiptFile":"bikram_fees_mehak.pdf","feeReceiptNo":"GBCC-2026-441","aadhaarFile":"aadhaar_mehak_signed.pdf","signatureAffirmed":True,"originalFare":950,"subsidizedAmountPaid":237.5},
            ]
            for p in apps:
                o=StudentApplication(id=p['id'],student_id=p['studentId'],name=p['name'],initials=p['initials'],college_id=p['collegeId'],college_name=p['collegeName'],roll_number=p['rollNumber'],course=p['course'],semester=p['semester'],pass_type=p['passType'],route=p['route'],status=p['status'],submitted_date=p['submittedDate'],aadhaar_number=p['aadhaarNumber']); apply(o,p); db.add(o)
        if not db.query(Ticket).count():
            tickets = [
                {"id":"tkt-1","ticketNumber":"PRTC-2026-99824","title":"Route 42 - Express","type":"single","route":"ISBT Sector 43 -> Patiala Central Bus Stand","timestamp":"Today, 09:15 AM","amount":45.0,"status":"active","validUntil":"Today, 01:15 PM"},
                {"id":"tkt-2","ticketNumber":"PASS-24HR-77192","title":"One Day Pass (24Hr Unlimited)","type":"day_pass","route":"All Punjab Roadways City Transit Zones (AC & Non-AC)","timestamp":"Yesterday","amount":120.0,"status":"expired","validUntil":"Expired Yesterday, 11:59 PM"},
                {"id":"tkt-3","ticketNumber":"CORP-PASS-2026-08","title":"Corporate Executive 1-Month Pass","type":"corporate_pass","route":"Chandigarh ISBT 43 -> Mohali Quark City / IT Park","timestamp":"01 Aug 2026","amount":1450.0,"status":"active","validUntil":"1 Month Active (30 Days)","companyName":"Infosys BPM Punjab Development Center","holderName":"Rohit Verma (Emp ID: INF-8849)"},
            ]
            for p in tickets:
                o=Ticket(id=p['id'],ticket_number=p['ticketNumber'],title=p['title'],type=p['type'],route=p['route'],timestamp=p['timestamp'],amount=p['amount'],status=p['status']); apply(o,p); db.add(o)

        demo=[('usr-student-01','PRTC-STU-9942','Navjot Singh Dhillon','navjot.dhillon@thapar.edu','student','Thapar Institute of Engg. & Technology'),('usr-corp-01','CORP-INF-8849','Rohit Verma','rohit.verma@infosys.com','corporate','Infosys Limited'),('usr-pass-01','PRTC-COMM-4412','Priya Sharma','priya.sharma22@gmail.com','passenger','Punjab State Transit Commuter'),('usr-college-01','PEC-ADMIN-01','Dr. S. Kapoor','deansw@pec.edu.in','college_admin','Punjab Engineering College (PEC)'),('usr-prtc-01','PRTC-PAT-HQ-091','S. Gurmukh Singh','g.singh@prtc.punjab.gov.in','prtc_admin','Pepsu Road Transport Corporation')]
        if not db.query(User).count():
            for id,pid,n,e,r,inst in demo: db.add(User(id=id,pass_id=pid,name=n,email=e,phone='',password_hash=hash_password('demo1234'),role_type=r,avatar_url='',institution=inst))
        db.commit()
    finally: db.close()
if __name__=='__main__': run()
