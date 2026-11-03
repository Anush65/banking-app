const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/admin/customers
 * List all customers with account summary
 */
router.get('/customers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              COUNT(a.account_id) AS account_count,
              COALESCE(SUM(a.balance), 0) AS total_balance,
              u.username
       FROM Customer c
       LEFT JOIN Account a ON c.customer_id = a.customer_id
       LEFT JOIN Users u ON c.customer_id = u.customer_id
       GROUP BY c.customer_id, u.username
       ORDER BY c.customer_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customers.' });
  }
});

/**
 * POST /api/admin/customers
 * Create a new customer (and optionally a user account)
 */
router.post('/customers', async (req, res) => {
  const { first_name, last_name, email, phone, address, username, password } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'first_name, last_name, and email are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert customer
    const custResult = await client.query(
      `INSERT INTO Customer (first_name, last_name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [first_name, last_name, email, phone || null, address || null]
    );
    const customer = custResult.rows[0];

    // Optionally create user login
    if (username && password) {
      const hashed = await bcrypt.hash(password, 10);
      await client.query(
        `INSERT INTO Users (username, password, role, customer_id)
         VALUES ($1, $2, 'customer', $3)`,
        [username, hashed, customer.customer_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, customer });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email or username already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create customer.' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/accounts
 * List all accounts
 */
router.get('/accounts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.account_id, a.balance, a.opened_date, a.status,
              c.customer_id, c.first_name, c.last_name, c.email,
              at.type_name, at.minimum_balance,
              b.branch_name, b.city, b.ifsc_code
       FROM Account a
       JOIN Customer c ON a.customer_id = c.customer_id
       JOIN Account_Type at ON a.account_type_id = at.account_type_id
       JOIN Branch b ON a.branch_id = b.branch_id
       ORDER BY a.account_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch accounts.' });
  }
});

/**
 * POST /api/admin/accounts
 * Create a new account for a customer
 */
router.post('/accounts', async (req, res) => {
  const { customer_id, branch_id, account_type_id, initial_balance } = req.body;

  if (!customer_id || !branch_id || !account_type_id) {
    return res.status(400).json({ error: 'customer_id, branch_id, and account_type_id are required.' });
  }

  try {
    // Check minimum balance
    const typeResult = await pool.query(
      `SELECT minimum_balance FROM Account_Type WHERE account_type_id = $1`,
      [account_type_id]
    );
    if (typeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid account type.' });
    }

    const minBalance = parseFloat(typeResult.rows[0].minimum_balance);
    const openingBalance = parseFloat(initial_balance) || 0;

    if (openingBalance < minBalance) {
      return res.status(400).json({
        error: `Initial balance must be at least ₹${minBalance} for this account type.`
      });
    }

    const result = await pool.query(
      `INSERT INTO Account (customer_id, branch_id, account_type_id, balance, opened_date, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, 'active')
       RETURNING account_id`,
      [customer_id, branch_id, account_type_id, openingBalance]
    );

    res.status(201).json({ success: true, account_id: result.rows[0].account_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

/**
 * GET /api/admin/transactions
 * List all transactions with full details
 */
router.get('/transactions', async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  try {
    const result = await pool.query(
      `SELECT t.transaction_id, t.account_id, t.transaction_type, t.amount,
              t.transaction_time, t.status,
              c.first_name, c.last_name, c.customer_id,
              at.type_name as account_type,
              b.branch_name
       FROM Transactions t
       JOIN Account a ON t.account_id = a.account_id
       JOIN Customer c ON a.customer_id = c.customer_id
       JOIN Account_Type at ON a.account_type_id = at.account_type_id
       JOIN Branch b ON a.branch_id = b.branch_id
       ORDER BY t.transaction_time DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

/**
 * GET /api/admin/audit-logs
 * List all audit log entries
 */
router.get('/audit-logs', async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  try {
    const result = await pool.query(
      `SELECT al.log_id, al.transaction_id, al.action, al.timestamp, al.remarks,
              t.account_id, t.transaction_type, t.amount,
              c.first_name, c.last_name
       FROM Audit_Log al
       LEFT JOIN Transactions t ON al.transaction_id = t.transaction_id
       LEFT JOIN Account a ON t.account_id = a.account_id
       LEFT JOIN Customer c ON a.customer_id = c.customer_id
       ORDER BY al.timestamp DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

/**
 * GET /api/admin/branches
 * List all branches
 */
router.get('/branches', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*,
              COUNT(a.account_id) AS account_count,
              COALESCE(SUM(a.balance), 0) AS total_deposits
       FROM Branch b
       LEFT JOIN Account a ON b.branch_id = a.branch_id
       GROUP BY b.branch_id
       ORDER BY b.branch_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch branches.' });
  }
});

/**
 * GET /api/admin/account-types
 * List all account types
 */
router.get('/account-types', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM Account_Type ORDER BY account_type_id`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch account types.' });
  }
});

/**
 * GET /api/admin/stats
 * Dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [customers, accounts, transactions, lowBalance, topTx] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM Customer`),
      pool.query(`SELECT COUNT(*) AS total, COALESCE(SUM(balance), 0) AS total_balance FROM Account WHERE status = 'active'`),
      pool.query(`SELECT COUNT(*) AS total FROM Transactions WHERE transaction_time > NOW() - INTERVAL '30 days'`),
      pool.query(
        `SELECT a.account_id, a.balance, c.first_name, c.last_name, at.type_name, at.minimum_balance
         FROM Account a
         JOIN Customer c ON a.customer_id = c.customer_id
         JOIN Account_Type at ON a.account_type_id = at.account_type_id
         WHERE a.status = 'active'
         ORDER BY (a.balance - at.minimum_balance) ASC
         LIMIT 5`
      ),
      pool.query(
        `SELECT t.transaction_id, t.amount, t.transaction_type, t.transaction_time,
                c.first_name, c.last_name
         FROM Transactions t
         JOIN Account a ON t.account_id = a.account_id
         JOIN Customer c ON a.customer_id = c.customer_id
         ORDER BY t.amount DESC
         LIMIT 5`
      ),
    ]);

    res.json({
      total_customers: parseInt(customers.rows[0].total),
      total_accounts: parseInt(accounts.rows[0].total),
      total_balance: parseFloat(accounts.rows[0].total_balance),
      monthly_transactions: parseInt(transactions.rows[0].total),
      low_balance_accounts: lowBalance.rows,
      top_transactions: topTx.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

module.exports = router;

