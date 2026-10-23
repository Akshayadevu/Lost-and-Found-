# FindBack — Lost and Found Platform

FindBack is a local full-stack web platform for anyone to report, find, claim, and recover belongings.

## What is included

- Public-user registration, login, logout, and protected personal dashboard.
- Lost and found reports with optional image uploads, safe public descriptions, and private verification details.
- Search, category/type/location/date filters, duplicate-report suggestions, and pagination-ready API responses.
- Ownership claims with duplicate prevention and transaction-safe approval/rejection.
- Database-backed report messages for handover coordination after a claim is involved.
- Administrator dashboard for moderation, claims decisions, status history, statistics, and CSV export.
- SQLite database stored locally at `server/storage/campusfind.sqlite`.

## Run locally (Windows PowerShell)

Open two terminals from this project folder.

### 1. Configure and start the server

```powershell
cd server
Copy-Item .env.example .env
```

Open `server\.env` and replace `JWT_SECRET` with a long random value. Then run:

```powershell
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

### 2. Start the React application

```powershell
cd client
npm install
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`.

## Create a local demo administrator

There is deliberately no public admin-sign-up page. With the server dependencies installed, run:

```powershell
cd server
npm run create-admin -- "FindBack Admin" admin@example.test "ChooseAStrongPassword123!"
```

Use a password of your own. Do not commit `.env`, the SQLite database, uploads, or real personal information.

## Database relationships

```text
users 1 ── * items
items 1 ── * claims
items 1 ── * item_status_history
items 1 ── * messages
```

`items` keeps the public report. `private_detail` and `contact_details` are excluded from public API responses. A claim decision uses a SQLite transaction so approving a claim and changing the item to `RETURNED` happen together.

## API groups

- `/api/auth` — registration, login, logout, current account.
- `/api/items` — public browsing, filters, report creation and ownership actions.
- `/api/claims` — create and view ownership claims.
- `/api/messages` — item-related private messages.
- `/api/dashboard` — personal dashboard summary and status updates.
- `/api/admin` — administrator statistics, moderation, claim decisions, and CSV export.

## Manual test checklist

1. Register a user account and log out/in.
2. Create a lost or found report and confirm it begins as `PENDING_REVIEW`.
3. Log in as the local admin and approve the report.
4. Confirm it appears in public browse results without private/contact data.
5. Register a second user; claim an active found report.
6. Approve or reject the claim as admin and inspect the status result.
7. Try visiting `/admin` as a standard user: the backend must refuse admin API calls.
8. Upload an allowed image, then try an invalid type or file above 3 MB.
