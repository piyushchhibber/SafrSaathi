# SafrSaathi — Production Architecture & Implementation Changelog

**Prepared:** 22 October 2026  
**Standards:** Server as Single Source of Truth · Zero-Trust Role Enforcement · Supabase & SQLite Compatibility

This document records all architectural updates, security fixes, and database migrations applied to the repository according to the **Implementation Plan: What to Change Now**.

---

## 1. Decisions & Security Matrix

| Component | Applied Decision | Rationale |
| :--- | :--- | :--- |
| **QR Expiry** | **Server-Stored Once** (`pass_issued_at`, `pass_expires_at`) | Storing fixed expiry timestamps on the server guarantees the countdown never restarts upon closing/reopening the pass modal or refreshing the page. |
| **User Profile on Login** | **Preserve Server Profile** | Sign-in forms only submit credentials. `apply_payload` was removed from the login path to prevent placeholder data from corrupting real student profiles. |
| **Database Path** | **Absolute Resolution** (`backend/data/prtc.db`) | Resolves relative to `backend/` directory regardless of whether the app is launched from repo root or the backend folder. |
| **Schema Migration** | **`ensure_columns()` helper** | SQLAlchemy's `create_all` does not add columns to existing tables in Supabase or SQLite. `ensure_columns()` automatically verifies and executes `ALTER TABLE` for missing columns. |
| **Session Restore** | **Server-Verified `/api/auth/me`** | Browser validates the bearer token against the server on reload. Expired or forged tokens are cleared and the user is redirected to the gateway. |
| **Direct Ticket Booking** | **Strict Route Validation (No Fallback)** | Ticket bookings validate against published schedules. Invalid routes return HTTP 400 instead of arbitrarily billing the first route in the database. |
| **OTP Auto-Submit** | **Safe 4th-Digit Trigger (`digitsOverride`)** | Triggers verification automatically when 4 digits are completed, guarded by `isVerifying` state to eliminate race conditions and double submissions. |
| **OTP Demo Bypass** | **REJECTED** | Set B's offline fallback allowed signing in as any user with incorrect credentials. Backend verification is now mandatory. |
| **Name-Based App Matching** | **REJECTED** | Matching by `name == actor.name` leaked records between different students sharing the same name. Scoping strictly uses `student_id`. |
| **Unrestricted Pass Verify** | **REJECTED** | `/api/passes/verify` restricted strictly to `prtc_admin` to prevent unauthorized inspection of student Aadhaar numbers and photos. |
| **LocalStorage App/Ticket Caching** | **REJECTED** | Client-side caching creates cross-user data leakage on shared computers. All application and ticket data is loaded strictly from the server. |

---

## 2. File-by-File Changes & Code Modifications

### 2.1 Backend Data Model: `backend/app/models.py`
* Added `pass_issued_at` and `pass_expires_at` to `StudentApplication` model:
```python
class StudentApplication(Base):
    ...
    subsidized_amount_paid: Mapped[float | None] = mapped_column(Float, nullable=True)
    original_fare: Mapped[float | None] = mapped_column(Float, nullable=True)
    pass_issued_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    pass_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

### 2.2 Schema Migration & DB Path: `backend/app/database.py`
* Implemented `ensure_columns()` for automated table migrations on Supabase (PostgreSQL) and SQLite:
```python
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
```
* Made relative SQLite URLs automatically resolve to `DEFAULT_DB_FILE` (`backend/data/prtc.db`).

### 2.3 API Endpoints & Role Protections: `backend/app/main.py`
1. **Startup Migration**: Called `ensure_columns()` after `Base.metadata.create_all(bind=engine)`.
2. **Protected Login**: Removed `apply_payload(user, p, ...)` from the login path in `auth_profile`.
3. **Session Verification**: Added `GET /api/auth/me`:
   ```python
   @app.get("/api/auth/me")
   def auth_me(actor: User = Depends(current_user)):
       return {
           "profile": serialize(actor, ("password_hash", "created_at", "last_login_at")),
       }
   ```
4. **Student Isolation**: Removed `| (StudentApplication.name == actor.name)` from `list_apps`.
5. **Route Schedule Strict Check**: Removed `schedule = db.scalars(select(RouteSchedule)).first()` from `create_ticket`. Unmatched routes raise `HTTPException(400)`.
6. **Immutable QR Expiry**: Updated `application_qr`:
   - Checks if `pass_issued_at` and `pass_expires_at` are set; if not, computes and persists them permanently.
   - Signs QR JWT with the fixed `expires_at` timestamp.
   - Scopes access strictly to `application.student_id in (actor.id, actor.pass_id)`.
7. **Pass Verification Protection**: Restricted `/api/passes/verify` to `actor: User = Depends(require_roles("prtc_admin"))`.

### 2.4 Seed Data & Automatic Repair: `backend/app/seed.py`
* Linked `app-101` directly to `usr-student-01`.
* Linked `usr-college-01` (`deansw@pec.edu.in`) to `college_id='pec'`.
* Added automatic database repair for existing tables to migrate demo IDs on startup without requiring manual SQL commands.

### 2.5 Safe OTP Auto-Submit: `Frontend/src/components/AuthModal.tsx`
* Added `isVerifying` state guard to block double submissions.
* Updated `handleVerifyOtp` to accept `digitsOverride?: string[]`.
* Updated `handleOtpDigitChange` to auto-trigger submission on 4th digit without reading stale React state.
* Replaced offline bypass with explicit server error reporting (`setOtpError(err?.message)`).

### 2.6 Server-Authoritative State & Logout: `Frontend/src/App.tsx`
* Removed `getStoredApplications`, `saveStoredApplications`, `getStoredTickets`, and `saveStoredTickets`.
* On page mount, verified session with `api.me()`. If token is expired, drops safely to `'gateway'` role.
* Bound tickets and applications strictly to server endpoints (`api.listApplications()` and `api.listTickets()`).
* Added `handleLogout` which purges tokens and resets portal to gateway.

### 2.7 Navigation & Logout Button: `Frontend/src/components/Header.tsx`
* Added `onLogout?: () => void` prop to Header and integrated a dedicated "Sign Out" button inside the profile menu.

### 2.8 Continuous Pass Countdown: `PassQrModal.tsx` & `StudentDashboard.tsx`
* Passed server `expiresAt` from `StudentDashboard` to `PassQrModal`.
* Synchronized `secondsRemaining` directly with `expiresAt` whenever the signed pass payload arrives from the backend.

---

## 3. Verification & Test Suite Results

1. **Frontend TypeScript Check**:
   ```powershell
   cd Frontend; npx tsc --noEmit
   # Result: 0 errors (Exit code: 0)
   ```
2. **Frontend Production Build**:
   ```powershell
   cd Frontend; npm run build
   # Result: ✓ built in 3.93s (Exit code: 0)
   ```
3. **Backend Logic & Security Test Suite**:
   Executed 9-point verification suite (`scratch/verify_fixes.py`):
   - `Wrong password rejection`: **PASSED** (HTTP 401)
   - `Valid login profile integrity`: **PASSED** (Original profile unaltered by login)
   - `/api/auth/me` token validation: **PASSED**
   - `list_apps` student scoping: **PASSED** (No leak of other students' data)
   - `Non-Punjab student registration rejection`: **PASSED** (HTTP 403)
   - `Punjab student application & multi-stage approvals`: **PASSED** (College -> PRTC approval)
   - `Server-stored fixed QR expiry`: **PASSED** (Expiry timestamp invariant across opens)
   - `Pass verification role guard`: **PASSED** (PRTC admin authorized; non-admin blocked)
   - `Ticket route validation`: **PASSED** (Invalid route rejected 400; valid route booked)
