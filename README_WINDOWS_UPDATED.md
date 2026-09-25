# Campus Coin — Windows Setup Guide

Campus Coin is a student budget and expense tracker.

It uses:

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MySQL (or MariaDB)

This guide is written for **Windows Command Prompt (CMD)** and is intended for someone setting up the project for the first time.

---

## 1. Before you start

Install these programs on your Windows computer:

| Program | Required version | Check it in CMD |
|---|---|---|
| Node.js | 18 or newer | `node -v` |
| npm | Comes with Node.js | `npm -v` |
| MySQL Server or MariaDB | MySQL 8.x / MariaDB 10.x | `mysql --version` |

You do **not** need Docker or an AI API key.

### Important

The project has two separate parts:

1. **Backend** — runs the API on port `5000`
2. **Frontend** — runs the React website on port `5173`

Both need to be running at the same time.

---

# 2. Project folders

Your project should look roughly like this:

```text
campus-coin/
│
├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    ├── .env.example
    └── package.json
```

---

# 3. Step 1 — Open Command Prompt in the project folder

The easiest way:

1. Open the `campus-coin` folder in File Explorer.
2. Click the address bar at the top.
3. Type:

```cmd
cmd
```

4. Press **Enter**.

A Command Prompt window should open with the project folder already selected.

You can check with:

```cmd
dir
```

You should see folders such as:

```text
backend
frontend
```

---

# 4. Step 2 — Check Node.js and npm

Run:

```cmd
node -v
npm -v
```

You should get version numbers.

For Node.js, the project requires **18 or newer**.

If `node` or `npm` is not recognized, install Node.js and reopen CMD.

---

# 5. Step 3 — Start MySQL

The database must be running before the backend can connect to it.

### If you installed MySQL Server normally

Open Windows Services:

1. Press `Windows + R`
2. Type:

```text
services.msc
```

3. Press Enter.
4. Find the MySQL service (the exact name can vary).
5. Start it if it is stopped.

### If you use XAMPP

Open the XAMPP Control Panel and start the MySQL/MariaDB service.

### Check from CMD

Run:

```cmd
mysql --version
```

If CMD says:

```text
'mysql' is not recognized...
```

the MySQL command-line program is not in your Windows PATH. MySQL may still be installed, but CMD cannot find the `mysql` command yet.


### XAMPP fallback — use this if `mysql` is not recognized

If you are using XAMPP, the MySQL executable is commonly here:

```text
C:\xampp\mysql\bin\mysql.exe
```

You can stay in your **project folder**:

```text
C:\Users\YourName\Downloads\campus-coin>
```

You do **not** need to change CMD into `C:\xampp\mysql\bin`.

First test MySQL:

```cmd
"C:\xampp\mysql\bin\mysql.exe" --version
```

If that works, run:

```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root -p < backend\database\schema.sql
```

Then:

```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root -p < backend\database\seed.sql
```

### XAMPP with no root password

Some XAMPP installations have a `root` account with **no password**.

If your XAMPP `root` account has no password, remove `-p`:

```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root < backend\database\schema.sql
```

Then:

```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root < backend\database\seed.sql
```


---

# 6. Step 4 — Create the Campus Coin database

Make sure CMD is still in the **campus-coin** project folder.

Run:

```cmd
mysql -u root -p < backend\database\schema.sql
```

CMD will ask for your MySQL password.

Type the password and press Enter.

Then run:

```cmd
mysql -u root -p < backend\database\seed.sql
```

Enter the same MySQL password again.

### What did those commands do?

- `schema.sql` creates the **campus_coin** database and its tables.
- `seed.sql` adds the default categories, welcome announcement, and demo admin account.

The seeded admin login is:

```text
Email:    admin@campuscoin.app
Password: Admin@123
```

Change this password after your first login.

---

# 7. Step 5 — Configure the backend

From the project root, run:

```cmd
cd backend
```

Install the backend packages:

```cmd
npm install
```

Create the backend `.env` file by copying the example:

```cmd
copy .env.example .env
```

Now open the `.env` file:

```cmd
notepad .env
```

Put your actual MySQL password in `DB_PASSWORD`.

The file should look like this:

```env
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

### What these settings mean

- `PORT=5000` → backend runs on port 5000
- `DB_HOST=localhost` → MySQL is on your own computer
- `DB_PORT=3306` → normal MySQL port
- `DB_USER=root` → MySQL username
- `DB_PASSWORD=...` → your MySQL password
- `DB_NAME=campus_coin` → database created by the SQL files
- `JWT_SECRET=...` → secret used for login tokens
- `CLIENT_ORIGIN=...` → allows the React frontend to connect to the backend

If you are using XAMPP and the `root` account has **no password**, use:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=campus_coin
```

Save the file and close Notepad.

---

# 8. Step 6 — Start the backend

You should still be inside:

```text
campus-coin\backend
```

Run:

```cmd
npm run dev
```

You should see something similar to:

```text
Campus Coin API running on http://localhost:5000
```

### Test the backend

Open your web browser and go to:

```text
http://localhost:5000/api/health
```

You should see:

```json
{"status":"ok","service":"campus-coin-api"}
```

**Do not close this CMD window.**

The backend needs to keep running.

---

# 9. Step 7 — Start the React frontend

Open a **second Command Prompt window**.

Go back to the project folder.

For example, if your project is already in the first CMD window, the safest simple method is to open the `campus-coin` folder in File Explorer again, click its address bar, type:

```cmd
cmd
```

and press Enter.

Now enter:

```cmd
cd frontend
```

Install the frontend packages:

```cmd
npm install
```

Create the frontend environment file:

```cmd
copy .env.example .env
```

If you need to check or edit it, run:

```cmd
notepad .env
```

The frontend must point to the running backend URL. According to the project's troubleshooting notes, the expected backend URL is:

```text
http://localhost:5000
```

Then start Vite:

```cmd
npm run dev
```

Vite should display a URL similar to:

```text
http://localhost:5173/
```

Open that address in your browser.

---

# 10. Step 8 — Log in

When the React website opens, you should see the login page.

### Student account

Click:

```text
Create a student account
```

and register.

### Admin account

Use:

```text
Email:    admin@campuscoin.app
Password: Admin@123
```

---

# 11. How the project works

The basic flow is:

```text
Your browser
    ↓
React frontend (Vite)
    ↓
Node.js + Express backend
    ↓
MySQL database
```

### Frontend

The React app shows the pages and sends requests to the backend.

### Backend

Node.js + Express handles login, transactions, budgets, reports, admin functions, etc.

### Database

MySQL stores users, transactions, categories, budgets, insights, saved tips, and announcements.

---

# 12. What the "AI" features actually do

The project does **not** require an external AI API.

There are two local rule-based features:

### Category suggestion

The app looks at the words in a transaction description.

For example:

```text
cafe
```

can suggest:

```text
Food
```

It can also learn from your previous corrections.

### Monthly insights

The app compares this month's spending with your previous spending and flags categories that have increased by **20% or more**.

These are rule-based features, not calls to ChatGPT or another online AI service.

---

# 13. Main features

### Dashboard

Shows:

- Monthly balance
- Income
- Expenses
- Top spending category
- Budget vs actual
- Saving tips
- Recent activity

### Transactions

You can:

- Add transactions
- Edit transactions
- Delete transactions
- Filter transactions
- Import CSV files

CSV columns must be exactly:

```text
date,type,category,amount,description
```

### Categories

You can use the default categories and manage your own personal categories.

### Budgets

Set a monthly spending limit for a category.

### Reports

Includes category charts, a six-month income-vs-expense chart, summary tables, and PDF export.

### Insights & Tips

Shows monthly spending insights and saving tips.

### Admin

Admins can view usage statistics, manage users, manage default categories, and manage announcements.

---

# 14. The two CMD windows you should keep open

When the project is running, you should normally have:

### CMD Window 1 — Backend

```cmd
cd backend
npm run dev
```

### CMD Window 2 — Frontend

```cmd
cd frontend
npm run dev
```

Both windows must stay open while you use the application.

---

# 15. Complete startup process after the first setup

Once everything has already been installed and configured, you usually only need to:

### CMD Window 1

From the project folder:

```cmd
cd backend
npm run dev
```

### CMD Window 2

From the project folder:

```cmd
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173/
```

You do **not** need to run `npm install` every time.

You only normally run `npm install` after installing the project for the first time or when its dependencies have changed.

---

# 16. Troubleshooting

| Problem | What to check |
|---|---|
| `npm` or `node` is not recognized | Install Node.js and reopen CMD |
| `mysql` is not recognized | MySQL's `bin` folder is not in Windows PATH |
| Backend gives a MySQL access error | Check `backend\.env` username and password |
| `ER_NO_SUCH_TABLE` | Run `schema.sql` again |
| Frontend says `Network Error` when logging in | Make sure the backend is running on port 5000 |
| CORS error | Make sure `CLIENT_ORIGIN` matches the frontend URL, normally `http://localhost:5173` |
| CSV import skips rows | Make sure the header is exactly `date,type,category,amount,description` |

---

# 17. Changing the seeded admin password

There is no admin "change password" screen in this version.

From:

```text
campus-coin\backend
```

run:

```cmd
npm run hash-password -- yourNewPassword
```

Copy the hash that the command returns.

Then open MySQL and update the admin record:

```sql
UPDATE users
SET password_hash='PASTE_THE_HASH_HERE'
WHERE email='admin@campuscoin.app';
```

Replace `PASTE_THE_HASH_HERE` with the hash generated by the command.

---

# 18. Important project notes

- The app does **not** connect to a real bank.
- Transactions are entered manually or imported from CSV.
- There is no payment processing.
- The two optional "AI" features are local rule-based features.
- The database structure is defined in `backend\database\schema.sql`.
- Default/demo data is added by `backend\database\seed.sql`.

---

# 19. Quick reference

### Database — normal command

From:

```text
C:\Users\YourName\Downloads\campus-coin>
```

run:

```cmd
mysql -u root -p < backend\database\schema.sql
mysql -u root -p < backend\database\seed.sql
```

### Database — XAMPP fallback

If `mysql` is not recognized:

```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root -p < backend\database\schema.sql
"C:\xampp\mysql\bin\mysql.exe" -u root -p < backend\database\seed.sql
```

If XAMPP `root` has no password, remove `-p`:

```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root < backend\database\schema.sql
"C:\xampp\mysql\bin\mysql.exe" -u root < backend\database\seed.sql
```

### Backend — CMD Window 1

```cmd
cd C:\Users\YourName\Downloads\campus-coin\backend
npm install
copy .env.example .env
notepad .env
npm run dev
```

### Frontend — CMD Window 2

```cmd
cd C:\Users\YourName\Downloads\campus-coin\frontend
npm install
copy .env.example .env
npm run dev
```

### Open the app

```text
http://localhost:5173/
```

### Backend health check

```text
http://localhost:5000/api/health
```

That's it. Your React + Node.js + MySQL project should now be running locally on Windows.
