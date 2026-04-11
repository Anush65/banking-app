-- ============================================================
-- Banking System Database Schema & Seed Data
-- Run this file against your banking_system PostgreSQL database
-- ============================================================

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS Audit_Log CASCADE;
DROP TABLE IF EXISTS Transactions CASCADE;
DROP TABLE IF EXISTS Account CASCADE;
DROP TABLE IF EXISTS Account_Type CASCADE;
DROP TABLE IF EXISTS Branch CASCADE;
DROP TABLE IF EXISTS Customer CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- ============================================================
-- USERS TABLE (for authentication)
-- ============================================================
CREATE TABLE Users (
  user_id     SERIAL PRIMARY KEY,
  username    VARCHAR(50) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,  -- bcrypt hash
  role        VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'customer')),
  customer_id INT NULL  -- links to Customer table for customer role
);

-- ============================================================
-- CUSTOMER TABLE
-- ============================================================
CREATE TABLE Customer (
  customer_id SERIAL PRIMARY KEY,
  first_name  VARCHAR(50) NOT NULL,
  last_name   VARCHAR(50) NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  phone       VARCHAR(20),
  address     TEXT
);

-- ============================================================
-- BRANCH TABLE
-- ============================================================
CREATE TABLE Branch (
  branch_id   SERIAL PRIMARY KEY,
  branch_name VARCHAR(100) NOT NULL,
  city        VARCHAR(50) NOT NULL,
  ifsc_code   VARCHAR(20) UNIQUE NOT NULL
);

-- ============================================================
-- ACCOUNT_TYPE TABLE
-- ============================================================
CREATE TABLE Account_Type (
  account_type_id SERIAL PRIMARY KEY,
  type_name       VARCHAR(50) NOT NULL,
  minimum_balance NUMERIC(15, 2) NOT NULL DEFAULT 0
);

-- ============================================================
-- ACCOUNT TABLE
-- ============================================================
CREATE TABLE Account (
  account_id      SERIAL PRIMARY KEY,
  customer_id     INT NOT NULL REFERENCES Customer(customer_id) ON DELETE CASCADE,
  branch_id       INT NOT NULL REFERENCES Branch(branch_id),
  account_type_id INT NOT NULL REFERENCES Account_Type(account_type_id),
  balance         NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  opened_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  status          VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'frozen'))
);

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE Transactions (
  transaction_id   SERIAL PRIMARY KEY,
  account_id       INT NOT NULL REFERENCES Account(account_id),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer_debit', 'transfer_credit')),
  amount           NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  transaction_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status           VARCHAR(10) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending'))
);

-- ============================================================
-- AUDIT_LOG TABLE
-- ============================================================
CREATE TABLE Audit_Log (
  log_id         SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES Transactions(transaction_id),
  action         VARCHAR(100) NOT NULL,
  timestamp      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remarks        TEXT
);

-- Add FK from Users to Customer
ALTER TABLE Users
  ADD CONSTRAINT fk_users_customer
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE SET NULL;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Branches
INSERT INTO Branch (branch_name, city, ifsc_code) VALUES
  ('Main Street Branch',   'Mumbai',    'BANK0001001'),
  ('Downtown Branch',      'Delhi',     'BANK0001002'),
  ('Harbor View Branch',   'Chennai',   'BANK0001003'),
  ('Tech Park Branch',     'Bangalore', 'BANK0001004'),
  ('Central City Branch',  'Hyderabad', 'BANK0001005');

-- Account Types
INSERT INTO Account_Type (type_name, minimum_balance) VALUES
  ('Savings',       500.00),
  ('Current',      1000.00),
  ('Fixed Deposit', 5000.00),
  ('Salary',           0.00);

-- Customers
INSERT INTO Customer (first_name, last_name, email, phone, address) VALUES
  ('Arjun',   'Sharma',    'arjun.sharma@email.com',    '+91-9876543210', '12 MG Road, Mumbai, Maharashtra'),
  ('Priya',   'Patel',     'priya.patel@email.com',     '+91-9876543211', '45 Nehru Street, Delhi'),
  ('Rahul',   'Gupta',     'rahul.gupta@email.com',     '+91-9876543212', '78 Anna Salai, Chennai, Tamil Nadu'),
  ('Sneha',   'Reddy',     'sneha.reddy@email.com',     '+91-9876543213', '23 Indiranagar, Bangalore'),
  ('Vikram',  'Singh',     'vikram.singh@email.com',    '+91-9876543214', '90 Banjara Hills, Hyderabad');

-- Accounts
INSERT INTO Account (customer_id, branch_id, account_type_id, balance, opened_date, status) VALUES
  (1, 1, 1, 25000.00,  '2022-01-15', 'active'),
  (1, 1, 2, 75000.00,  '2022-03-20', 'active'),
  (2, 2, 1, 12500.00,  '2022-05-10', 'active'),
  (3, 3, 4, 45000.00,  '2023-01-01', 'active'),
  (3, 3, 1,  3200.00,  '2023-06-15', 'active'),
  (4, 4, 2, 98000.00,  '2021-11-30', 'active'),
  (5, 5, 1,   750.00,  '2023-09-01', 'active');

-- Seed transactions
INSERT INTO Transactions (account_id, transaction_type, amount, transaction_time, status) VALUES
  (1, 'deposit',          5000.00,  NOW() - INTERVAL '10 days', 'success'),
  (1, 'withdrawal',       2000.00,  NOW() - INTERVAL '8 days',  'success'),
  (2, 'deposit',         10000.00,  NOW() - INTERVAL '7 days',  'success'),
  (3, 'deposit',          3000.00,  NOW() - INTERVAL '6 days',  'success'),
  (3, 'withdrawal',       1500.00,  NOW() - INTERVAL '5 days',  'success'),
  (4, 'deposit',         15000.00,  NOW() - INTERVAL '4 days',  'success'),
  (1, 'transfer_debit',   2500.00,  NOW() - INTERVAL '3 days',  'success'),
  (3, 'transfer_credit',  2500.00,  NOW() - INTERVAL '3 days',  'success'),
  (6, 'deposit',         20000.00,  NOW() - INTERVAL '2 days',  'success'),
  (7, 'withdrawal',        200.00,  NOW() - INTERVAL '1 day',   'success');

-- Seed audit logs
INSERT INTO Audit_Log (transaction_id, action, timestamp, remarks) VALUES
  (1,  'DEPOSIT',          NOW() - INTERVAL '10 days', 'Customer deposit of ₹5000'),
  (2,  'WITHDRAWAL',       NOW() - INTERVAL '8 days',  'Customer withdrawal of ₹2000'),
  (3,  'DEPOSIT',          NOW() - INTERVAL '7 days',  'Customer deposit of ₹10000'),
  (4,  'DEPOSIT',          NOW() - INTERVAL '6 days',  'Customer deposit of ₹3000'),
  (5,  'WITHDRAWAL',       NOW() - INTERVAL '5 days',  'Customer withdrawal of ₹1500'),
  (6,  'DEPOSIT',          NOW() - INTERVAL '4 days',  'Customer deposit of ₹15000'),
  (7,  'TRANSFER_DEBIT',   NOW() - INTERVAL '3 days',  'Transfer sent ₹2500 to account #3'),
  (8,  'TRANSFER_CREDIT',  NOW() - INTERVAL '3 days',  'Transfer received ₹2500 from account #1'),
  (9,  'DEPOSIT',          NOW() - INTERVAL '2 days',  'Customer deposit of ₹20000'),
  (10, 'WITHDRAWAL',       NOW() - INTERVAL '1 day',   'Customer withdrawal of ₹200');

-- ============================================================
-- USER ACCOUNTS (passwords are bcrypt hashes)
-- admin     / admin123
-- customer1 / pass123   (Arjun Sharma)
-- customer2 / pass123   (Priya Patel)
-- customer3 / pass123   (Rahul Gupta)
-- customer4 / pass123   (Sneha Reddy)
-- customer5 / pass123   (Vikram Singh)
-- ============================================================
INSERT INTO Users (username, password, role, customer_id) VALUES
  ('admin',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',    NULL),
  ('customer1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 1),
  ('customer2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 2),
  ('customer3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 3),
  ('customer4', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 4),
  ('customer5', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 5);

-- NOTE: The hash above is for 'password' (bcrypt default). 
-- Run the app once and use the /api/seed-passwords endpoint or 
-- manually update passwords using the backend's bcrypt utility.