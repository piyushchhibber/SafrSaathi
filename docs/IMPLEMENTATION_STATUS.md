# SafrSaathi Implementation Status

Last updated: 2026-10-08

## Product goal

SafrSaathi is a digital PRTC transit-pass platform. Students apply online, a college verifies the application, PRTC gives final approval, and an approved student receives a signed QR pass that a conductor can verify. Passenger and corporate ticket flows use the same secure backend.

## Current implementation

### Completed locally

- React, TypeScript, Vite frontend and FastAPI, SQLAlchemy backend are connected.
- SQLite supports local development; the backend accepts a PostgreSQL `DATABASE_URL` for deployment.
- Password accounts issue JWT access tokens.
- Protected application and ticket routes require a Bearer token.
- College and PRTC approvals are restricted to their respective authenticated roles.
- The ticket-verification commit crash was repaired.
- Approved student applications receive a signed, expiring QR PNG.
- The backend validates the signed student-pass QR payload.
- Google Identity Services UI and backend ID-token verification are prepared, but require a Google OAuth client ID before they can be enabled.
- Frontend TypeScript validation and production build pass.

### Still required before public launch

- Configure Google OAuth, PostgreSQL, backend hosting, and frontend hosting.
- Provision real college and PRTC administrator accounts; self-registration is intentionally blocked for these roles.
- Decide and implement the real student-ID verification source: college enrollment data or manual document review.
- Store Aadhaar and fee-receipt documents in private object storage, not the application server or Git repository.
- Build the conductor scan interface and connect it to the existing QR validation endpoint.
- Replace simulated OTP and payment UI with real providers, or label them clearly as demo-only.
- Add automated API and frontend tests.
- Remove the committed SQLite database from Git history before any public production release.

## Deployment decisions needed

| Area | Recommended choice | Status |
| --- | --- | --- |
| Frontend | Vercel | Not configured |
| Backend | Render | Not configured |
| Database and private document storage | Supabase | PostgreSQL connected locally and starter data seeded |
| Sign-in | Google Identity Services | Local client ID and Google test user configured; browser sign-in test pending |
| Student validation | College enrollment list plus manual review fallback | Decision needed |

## Configuration values

Set these only in the hosting dashboards or local untracked `.env` files. Never commit them or paste database passwords into chat.

```env
# Backend
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=A_RANDOM_VALUE_AT_LEAST_32_CHARACTERS_LONG
GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com
CORS_ORIGINS=https://YOUR-VERCEL-PROJECT.vercel.app

# Frontend
VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com/api
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com
```

## Change log

### 2026-10-08

- Reviewed the repository and shared project history.
- Added authenticated API foundations, role protections, QR issuance and verification, Google Sign-In configuration support, and safer public bootstrap data.
- Added this living documentation.
- Supabase PostgreSQL project was created successfully in the Mumbai region. The database connection has not yet been connected to the backend.
- Supabase connection details were obtained by the project owner and must remain in a local untracked environment file or hosting dashboard.
- Added explicit loading of the private `backend/.env` configuration file so the backend can use the configured PostgreSQL connection.
- Verified the backend can connect to Supabase PostgreSQL and seeded the initial demo data.
- Google Cloud project was created; OAuth consent configuration is the next deployment task.
- Google OAuth consent screen was configured in testing mode.
- Google OAuth web client was created. Its client ID must be stored only in the private backend and frontend environment files.
- Google Client ID was configured locally and an OAuth test user was added.
- Local frontend and backend services were started for browser testing.
- Added reliable local CORS support for Vite ports 3000, 3001, and 5173 while retaining configurable production origins.
- Verified the local frontend can load at `http://localhost:3001` and communicate with the backend without a CORS preflight failure.
