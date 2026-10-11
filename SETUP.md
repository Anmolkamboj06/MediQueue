# MediQueue --- Project Setup Guide

This guide explains how to configure and run the MediQueue Patient Queue
Management System locally.

## 1. Prerequisites

Install these tools before starting:

-   Node.js (LTS version recommended)
-   npm (included with Node.js)
-   PostgreSQL
-   Git
-   Visual Studio Code (recommended)

Check Node.js and npm:

``` powershell
node --version
npm --version
git --version
```

## 2. Project Structure

The project is expected to contain the frontend and backend folders:

``` text
PatientQueueManagement-Enhanced/
├── frontend/
├── backend/
│   ├── src/
│   ├── schema.sql
│   └── .env
├── .gitignore
└── README.md
```

Your actual folder names may differ. Use the folder names present in
your project.

## 3. Configure PostgreSQL

1.  Start PostgreSQL.
2.  Open pgAdmin and connect to your local PostgreSQL server.
3.  Create a database named `patient queue`, or use the database name
    already configured in your backend `.env` file.
4.  Check that the database contains the application's tables before
    running the app.

The backend schema file is `backend/schema.sql`. It describes the tables
and indexes for a fresh database. **Do not blindly run the complete
schema over an existing database.** Back up an existing database first
and use careful migrations for changes so that patient records are
preserved.

## 4. Configure backend environment variables

In the `backend` folder, create a file named `.env`. Use your own local
values:

``` dotenv
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=patient queue
DB_PASSWORD=REPLACE_WITH_YOUR_LOCAL_DATABASE_PASSWORD
DB_PORT=5432
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
FRONTEND_URL=http://localhost:5173
```

Add email settings only if the features you use require them:

``` dotenv
EMAIL_USER=REPLACE_WITH_YOUR_EMAIL
EMAIL_APP_PASSWORD=REPLACE_WITH_YOUR_EMAIL_APP_PASSWORD
```

Notes:

-   Do not commit `.env` to GitHub.
-   Do not put real passwords, JWT secrets, or email app passwords in
    this guide or in `.env.example`.
-   If your current backend uses different environment variable names,
    follow the names referenced by your backend code.
-   Use a long, unique JWT secret for local development and a separate
    secret in production.

## 5. Install backend dependencies

Open a terminal in the project root, then run:

``` powershell
cd backend
npm install
```

Start the backend:

``` powershell
node src/server.js
```

The backend is expected to use port `5000` unless your `.env` specifies
another port. Keep this terminal open.

If the project has a configured development script, you may instead use:

``` powershell
npm run dev
```

## 6. Install frontend dependencies

Open a **second terminal** from the project root:

``` powershell
cd frontend
npm install
npm run dev
```

Vite commonly serves the frontend at:

``` text
http://localhost:5173
```

Open that address in your browser. Use the URL printed by Vite if it
differs.

## 7. Basic verification

Check the following one by one:

1.  PostgreSQL is running and the configured database exists.
2.  The backend starts without configuration errors.
3.  The frontend starts and opens in the browser.
4.  Login works with an existing test account.
5.  Patient registration saves data to PostgreSQL.
6.  Queue entries display the correct patient and status.
7.  Patient accounts can only access their own patient information.
8.  Appointment, medical-record, medicine, and notification features are
    tested before being described as complete.

If a page is blank or a request fails, check the browser developer
console and both terminal windows. Read the backend error message before
changing code or database tables.

## 8. GitHub safety

Before pushing the project, make sure the root `.gitignore` contains at
least:

``` gitignore
node_modules/
.env
.env.*
!.env.example
dist/
build/
coverage/
.DS_Store
```

Check for secrets in source files and configuration files before
committing. If a real credential was committed or shared, rotate it;
removing it from the latest commit alone does not invalidate it.

## 9. Suggested first Git commands

Run these commands from the project root after reviewing `.gitignore`:

``` powershell
git status
git add .
git status
```

Review the staged file list carefully. Confirm that `.env`,
`node_modules`, database dumps, and private patient data are not staged.
Then commit and push using the repository's configured remote.

## 10. Troubleshooting

### Backend cannot connect to PostgreSQL

-   Confirm PostgreSQL is running.
-   Verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`
    in `backend/.env`.
-   Confirm the database name matches exactly.
-   Check the error printed by the backend.

### `node` or `npm` is not recognized

Install Node.js LTS, restart the terminal, and rerun the version
commands in Section 1.

### `Cannot find module`

Make sure the terminal is in the correct project folder and run
`npm install` in the relevant `backend` or `frontend` folder.

### Port already in use

Check whether another copy of the backend or frontend is running. Stop
the duplicate process or configure a different port consistently.

------------------------------------------------------------------------

**Security reminder:** Use fictional test patient data in public demos.
Do not publish real patient records, database backups, `.env` files, or
credentials.
