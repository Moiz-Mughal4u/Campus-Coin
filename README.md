# Campus Coin

A student-first budget and expense tracker, built to the "Smart Spending Student
Style" SRS: React (Vite) frontend, Node.js/Express backend, MySQL database.

This README explains **every step** to get the project running on your own
computer, plus how the pieces fit together.

---

## 1. What's inside

```
campus-coin/
├── backend/              Node.js + Express API
│   ├── database/
│   │   ├── schema.sql    Creates the database and all tables
│   │   └── seed.sql      Default categories + a demo admin account
│   ├── src/
│   │   ├── config/db.js       MySQL connection pool
│   │   ├── middleware/auth.js JWT auth + admin-only guard
│   │   ├── routes/            One file per feature area (auth, transactions, budgets, ...)
│   │   ├── utils/
│   │   │   ├── aiCategorize.js  "AI" category suggestion (keyword-based, offline)
│   │   │   └── insights.js      "AI" monthly insights + saving tips (rule-based, offline)
│   │   └── server.js     App entry point
│   ├── .env.example      Copy to .env and fill in your MySQL password
│   └── package.json
└── frontend/             React (Vite) single-page app
    ├── src/
    │   ├── api/client.js      Axios instance, attaches your login token
    │   ├── context/AuthContext.jsx
    │   ├── components/        Layout (sidebar/dark-mode), route guard, breadcrumbs
    │   ├── pages/              One file per screen
    │   └── styles/theme.css   Colors, type, and shared UI styles
    ├── .env.example       Copy to .env (points the app at your backend URL)
    └── package.json
```

### Why some "AI" features are rule-based

The SRS marks AI category-suggestion and AI-generated insights as **optional**
and advisory. To keep the project runnable by anyone with zero API keys and
no internet dependency, both are implemented as transparent, well-documented
heuristics:

- **Category suggestion** (`backend/src/utils/aiCategorize.js`): matches
  keywords in the transaction description (e.g. "cafe" → Food) and learns
  from your own past corrections.
- **Monthly insights & tips** (`backend/src/utils/insights.js`): compares
  this month's spending per category against your own trailing average and
  flags categories that grew 20%+.

Both are isolated in their own files with a comment explaining exactly how to
swap in a real AI/LLM API call later if you want to extend the project.

---

## 2. Prerequisites

Install these once, if you don't already have them:

| Tool | Version | Check with |
|---|---|---|
| Node.js | 18 or newer | `node -v` |
| npm | comes with Node | `npm -v` |
| MySQL Server (or MariaDB) | 8.x / 10.x | `mysql --version` |

You do **not** need Docker, an AI API key, or any paid service — everything
runs locally.

---

## 3. Set up the database

1. Start your MySQL server (varies by OS — e.g. `sudo service mysql start`
   on Linux, or open MySQL Workbench / XAMPP's control panel on Windows).
2. From a terminal, log in and run the schema and seed files:

   ```bash
   mysql -u root -p < backend/database/schema.sql
   mysql -u root -p < backend/database/seed.sql
   ```

   This creates a `campus_coin` database with all tables, the default
   income/expense categories, a welcome announcement, and one **admin**
   account:

   - Email: `admin@campuscoin.app`
   - Password: `Admin@123`

   Change this password after your first login (there's no "change my own
   password" screen for admins in this build — do it directly in MySQL with
   `npm run hash-password -- yourNewPassword` in the backend folder, then
   `UPDATE users SET password_hash='<hash>' WHERE email='admin@campuscoin.app';`).

---

## 4. Run the backend API

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in your real MySQL password and a random JWT secret:

```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_coin
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

Then start it:

```bash
npm run dev
```

You should see:

```
Campus Coin API running on http://localhost:5000
```

Verify it's alive by visiting `http://localhost:5000/api/health` in a
browser — it should return `{"status":"ok","service":"campus-coin-api"}`.

Keep this terminal window open; the API needs to stay running.

---

## 5. Run the frontend

Open a **second** terminal window (leave the backend running in the first):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite will print a local URL, normally:

```
➜  Local:   http://localhost:5173/
```

Open that URL in your browser. You'll land on the login screen.

- **As a student**: click "Create a student account" and register.
- **As the admin**: log in with `admin@campuscoin.app` / `Admin@123`.

---

## 6. Everyday use — what to expect

- **Dashboard** — this month's balance, income, expense, top category,
  budget-vs-actual bars, top saving tips, and recent activity.
- **Transactions** — quick-add form (with the AI category suggestion
  appearing as a tappable pill once you type a description), a filterable
  history table, edit/delete, and CSV import (columns: `date,type,category,amount,description`).
- **Categories** — the shared default categories, plus "Manage Own
  Categories" to add/delete your personal ones.
- **Budgets** — set a monthly cap per category; progress bars and an alert
  banner appear once you're near or over.
- **Reports** — category-wise bar chart, 6-month income-vs-expense line
  chart, daily/weekly summary table, and a "Export PDF" button.
- **Insights & Tips** — the month's plain-language snapshot (bookmarkable),
  ranked saving tips you can pin or dismiss, and a history of past months.
- **Sitemap** — a page listing every screen and its URL, linked from the
  sidebar, per the SRS's navigation requirement.
- **Admin overview** (admin login only) — usage stats, user management
  (disable/remove), default category management, and announcements.
- **Dark mode / font size** — toggle buttons at the bottom of the sidebar.

---

## 7. Troubleshooting

| Problem | Likely fix |
|---|---|
| Frontend shows "Network Error" on login | Backend isn't running, or `frontend/.env`'s `VITE_API_URL` doesn't match the backend's actual port. |
| Backend crashes with a MySQL access error | Check `backend/.env` — wrong `DB_USER`/`DB_PASSWORD`, or MySQL isn't running. |
| `ER_NO_SUCH_TABLE` errors | You haven't run `schema.sql` yet (step 3). |
| CORS error in the browser console | Make sure `CLIENT_ORIGIN` in `backend/.env` matches the URL Vite actually printed (default `http://localhost:5173`). |
| CSV import skips every row | Check your CSV has a header row with exactly these column names: `date,type,category,amount,description`. |

---

## 8. Notes for the project report

- **Database design**: see `backend/database/schema.sql` for the full DDL
  (users, categories, transactions, budgets, insights, saved_tips,
  announcements) with foreign keys and constraints.
- **No real banking integration**: all data is manually entered or imported
  via CSV, per the SRS's constraints — there is no payment processing.
- **AI usage disclosure**: this codebase was authored with AI assistance
  (an AI coding assistant helped scaffold and implement the routes,
  components, and this documentation). The two "optional AI" features
  (category suggestion, monthly insights) are intentionally implemented as
  transparent local heuristics rather than calls to a third-party AI
  service — see section "Why some AI features are rule-based" above for the
  reasoning and how to extend them with a real model.
- **Test credentials**: seed an admin with `database/seed.sql`
  (`admin@campuscoin.app` / `Admin@123`); register any number of student
  accounts through the UI.
