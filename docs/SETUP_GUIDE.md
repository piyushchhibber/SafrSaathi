# SafrSaathi Setup Guide

Follow these steps in order. Stop after each section and tell the project assistant what you see if a screen or label differs.

## Part 1 Create a Supabase project

1. Go to `https://supabase.com` and select **Start your project**.
2. Sign in with your GitHub account. This does not give SafrSaathi access to your repositories by itself.
3. Choose **New project**.
4. Select your organization, give the project a name such as `safrsaathi`, and choose a nearby region such as Mumbai or Singapore.
5. Create a strong database password and save it in a password manager. Do not paste it into chat.
6. Wait until the project status shows that it is ready.
7. Open **Connect** or **Project Settings → Database** and find the PostgreSQL connection string. Keep it private; it will be entered directly in Render later.

## Part 2 Create Google Sign In

1. Go to `https://console.cloud.google.com` and sign in with the Google account that should own the project.
2. Use the project selector at the top, choose **New Project**, and name it `SafrSaathi`.
3. Open **APIs and Services → OAuth consent screen**.
4. Select **External**, choose **Create**, then enter your application name and support email. Use your own email as the developer contact.
5. Save the consent screen. Keep the app in testing mode until the project is ready for public users.
6. Open **APIs and Services → Credentials → Create credentials → OAuth client ID**.
7. Choose **Web application** and name it `SafrSaathi Web`.
8. Under **Authorized JavaScript origins**, add:

```text
http://localhost:3000
https://safrsaathi.vercel.app
```

9. Select **Create**. Copy the **Client ID** only. It ends in `.apps.googleusercontent.com`. Do not share a client secret.
10. When Vercel gives us the final project URL, we will add that URL as another authorized origin.

## Part 3 Create Render and Vercel accounts

1. Go to `https://render.com`, select **Get Started**, and sign in with GitHub.
2. Go to `https://vercel.com`, select **Continue with GitHub**, and sign in with GitHub.
3. Authorize each platform only to access the `piyushchhibber/SafrSaathi` repository, if GitHub offers repository-specific access.
4. Do not deploy yet. We must first finish the deployment configuration and remove the local database from version control.

## Part 4 Tell the assistant these safe details

Send only the following:

```text
Supabase project ready: yes/no
Google Client ID: ...apps.googleusercontent.com
Render account ready: yes/no
Vercel account ready: yes/no
Student verification choice: enrollment list / manual review / demo format validation
```

Do not send database passwords, GitHub personal-access tokens, API keys, or client secrets.

## Part 5 Run the app on your computer

Open two PowerShell windows and leave both running while you test.

In the first window, start the backend:

```powershell
cd D:\SafrSathi\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Wait until it says that Uvicorn is running on `http://127.0.0.1:8000`.

In the second window, start the frontend:

```powershell
cd D:\SafrSathi\Frontend
npm run dev
```

Wait for Vite to display `http://localhost:3000`, then open that address in your browser. If either window shows an error, copy the error text into chat without including database URLs or secrets.
