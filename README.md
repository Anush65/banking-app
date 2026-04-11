# 🏦 NexaBank — Database-Centric Banking Transaction System

A full-stack banking system built with **React**, **Node.js/Express**, and **PostgreSQL**, featuring role-based access control, real-time banking operations, and comprehensive audit logging.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Demo Credentials](#demo-credentials)
- [Troubleshooting](#troubleshooting)

---

## 🛠 Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Frontend   | React 18, React Router v6     |
| Backend    | Node.js, Express.js           |
| Database   | PostgreSQL                    |
| Auth       | JWT (jsonwebtoken) + bcryptjs |
| HTTP       | Axios                         |
| DB Driver  | pg (node-postgres)            |

---

## ✨ Features

### Authentication & RBAC
- JWT-based authentication with 24-hour expiry
- Two roles: **Admin** and **Customer**
- Protected routes with role enforcement

### Customer Dashboard
- View all personal accounts with balances
- Full transaction history
- **Deposit** — with quick-amount buttons
- **Withdraw** — with minimum balance enforcement
- **Transfer** — between any two accounts (with DB transaction safety)

### Admin Dashboard
- KPI overview: total customers, accounts, deposits, monthly transactions
- Top 5 highest-value transactions
- Low balance account alerts
- Full customer management (create + login credentials)
- Full account management (create with type/branch assignment)
- Complete transaction history with filtering
- Immutable audit log trail
- Branch network overview with statistics

### Banking Operations (Backend)
- All operations use `BEGIN / COMMIT / ROLLBACK` PostgreSQL transactions
- Negative balance prevention via DB `CHECK` constraint + application logic
- Deadlock-safe transfer using consistent lock ordering
- Automatic `Audit_Log` entries for every operation
- Row-level locking (`FOR UPDATE`) on accounts during writes

---

## 📁 Project Structure

```
banking-app/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT verification, role guards
│   ├── routes/
│   │   ├── auth.js          # POST /login, GET /me
│   │   ├── customer.js      # GET /customer/:id/accounts|transactions
│   │   ├── banking.js       # POST /deposit, /withdraw, /transfer
│   │   └── admin.js         # All /admin/* routes
│   ├── scripts/
│   │   └── seedPasswords.js # One-time password seeder
│   ├── db.js                # PostgreSQL connection pool
│   ├── server.js            # Express app entry point
│   ├── schema.sql           # Full DB schema + seed data
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── Sidebar.js         # Navigation sidebar
        │   ├── Toast.js           # Toast notifications
        │   └── BankingModals.js   # Deposit/Withdraw/Transfer modals
        ├── context/
        │   └── AuthContext.js     # Global auth state
        ├── pages/
        │   ├── LoginPage.js
        │   ├── CustomerDashboard.js
        │   ├── AdminDashboard.js
        │   ├── AdminCustomers.js
        │   ├── AdminAccounts.js
        │   ├── AdminTransactions.js
        │   ├── AdminAuditLogs.js
        │   └── AdminBranches.js
        ├── utils/
        │   ├── api.js         # Axios instance with interceptors
        │   └── format.js      # Currency, date, transaction formatters
        ├── App.js
        ├── index.js
        └── index.css          # Global design system
```

---

## 📦 Prerequisites

- **Node.js** v18+ (`node --version`)
- **npm** v9+ (`npm --version`)
- **PostgreSQL** v13+ running locally
- A database named `banking_system` already created

---

## 🚀 Setup Instructions

### Step 1: Clone / Extract the project

```bash
cd banking-app
```

### Step 2: Set up the Database

Connect to your PostgreSQL instance and run the schema file:

```bash
psql -U postgres -d banking_system -f backend/schema.sql
```

Or from within `psql`:
```sql
\c banking_system
\i /path/to/banking-app/backend/schema.sql
```

This will:
- Drop and recreate all tables
- Insert seed data (5 branches, 4 account types, 5 customers, 7 accounts, 10 transactions)
- Create user accounts (with placeholder password hashes)

### Step 3: Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banking_system
DB_USER=postgres
DB_PASSWORD=your_actual_password
JWT_SECRET=change_this_to_a_long_random_string
PORT=5000
```

### Step 4: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 5: Seed Correct Passwords

The SQL file uses placeholder hashes. Run this to set proper bcrypt passwords:

```bash
# Option A: Node script
node scripts/seedPasswords.js

# Option B: HTTP endpoint (after starting the server)
curl -X POST http://localhost:5000/api/seed-passwords
```

### Step 6: Start the Backend

```bash
npm start
# Server runs on http://localhost:5000
```

You should see:
```
✅ PostgreSQL connected successfully
🏦 Banking System API running on http://localhost:5000
```

### Step 7: Install & Start the Frontend

In a new terminal:
```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## 🗃 Database Schema

```sql
Users          — Authentication (username, password hash, role, customer_id FK)
Customer       — customer_id, first_name, last_name, email, phone, address
Branch         — branch_id, branch_name, city, ifsc_code
Account_Type   — account_type_id, type_name, minimum_balance
Account        — account_id, customer_id, branch_id, account_type_id, balance, opened_date, status
Transactions   — transaction_id, account_id, transaction_type, amount, transaction_time, status
Audit_Log      — log_id, transaction_id, action, timestamp, remarks
```

**Transaction types:** `deposit`, `withdrawal`, `transfer_debit`, `transfer_credit`

---

## 📡 API Reference

### Auth
| Method | Endpoint              | Auth     | Description                  |
|--------|-----------------------|----------|------------------------------|
| POST   | `/api/login`          | None     | Login, returns JWT token     |
| GET    | `/api/me`             | Any      | Get current user info        |
| POST   | `/api/seed-passwords` | None     | One-time password seeder     |

### Customer
| Method | Endpoint                           | Auth         | Description              |
|--------|------------------------------------|--------------|--------------------------|
| GET    | `/api/customer/:id/accounts`       | Self/Admin   | List customer accounts   |
| GET    | `/api/customer/:id/transactions`   | Self/Admin   | List customer transactions |
| GET    | `/api/customer/:id/profile`        | Self/Admin   | Get customer profile     |

### Banking Operations
| Method | Endpoint          | Auth | Description                           |
|--------|-------------------|------|---------------------------------------|
| POST   | `/api/deposit`    | Any  | `{ account_id, amount }`              |
| POST   | `/api/withdraw`   | Any  | `{ account_id, amount }`              |
| POST   | `/api/transfer`   | Any  | `{ from_account_id, to_account_id, amount }` |

### Admin
| Method | Endpoint                    | Auth  | Description              |
|--------|-----------------------------|-------|--------------------------|
| GET    | `/api/admin/customers`      | Admin | All customers            |
| POST   | `/api/admin/customers`      | Admin | Create customer          |
| GET    | `/api/admin/accounts`       | Admin | All accounts             |
| POST   | `/api/admin/accounts`       | Admin | Create account           |
| GET    | `/api/admin/transactions`   | Admin | All transactions         |
| GET    | `/api/admin/audit-logs`     | Admin | All audit log entries    |
| GET    | `/api/admin/branches`       | Admin | All branches             |
| GET    | `/api/admin/account-types`  | Admin | All account types        |
| GET    | `/api/admin/stats`          | Admin | Dashboard statistics     |

---

## 🔑 Demo Credentials

| Role     | Username   | Password  | Customer         |
|----------|------------|-----------|------------------|
| Admin    | admin      | admin123  | —                |
| Customer | customer1  | pass123   | Arjun Sharma     |
| Customer | customer2  | pass123   | Priya Patel      |
| Customer | customer3  | pass123   | Rahul Gupta      |
| Customer | customer4  | pass123   | Sneha Reddy      |
| Customer | customer5  | pass123   | Vikram Singh     |

---

## 🔒 Security Features

- Passwords stored as bcrypt hashes (10 salt rounds)
- JWT tokens expire after 24 hours
- Account ownership verified before any operation
- PostgreSQL row-level locking prevents race conditions
- Deadlock-safe fund transfers (consistent lock ordering by account ID)
- `CHECK (balance >= 0)` constraint at DB level
- Foreign key constraints enforced across all tables

---

## 🐛 Troubleshooting

**Backend can't connect to PostgreSQL**
- Verify `DB_PASSWORD` in `.env` matches your PostgreSQL user password
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Check the database exists: `psql -U postgres -l | grep banking_system`

**"Invalid username or password" on login**
- Run the password seeder: `node backend/scripts/seedPasswords.js`
- Or call: `POST http://localhost:5000/api/seed-passwords`

**Frontend shows network error**
- Ensure backend is running on port 5000
- The React dev server proxies `/api` to `localhost:5000` via `"proxy"` in `package.json`

**Schema errors on import**
- The schema uses `DROP TABLE IF EXISTS ... CASCADE` so it's safe to re-run
- If you want to keep existing data, comment out the DROP lines in `schema.sql`