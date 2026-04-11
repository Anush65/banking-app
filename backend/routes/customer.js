const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin, requireSelfOrAdmin } = require('../middleware/auth');

/**
 * GET /api/customer/:id/accounts
 * Get all accounts for a customer
 */
router.get('/:id/accounts', authenticateToken, requireSelfOrAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT a.account_id, a.balance, a.opened_date, a.status,
              at.type_name, at.minimum_balance,
              b.branch_name, b.city, b.ifsc_code,
              c.first_name, c.last_name
       FROM Account a
       JOIN Account_Type at ON a.account_type_id = at.account_type_id
       JOIN Branch b ON a.branch_id = b.branch_id
       JOIN Customer c ON a.customer_id = c.customer_id
       WHERE a.customer_id = $1
       ORDER BY a.opened_date DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch accounts.' });
  }
});

/**
 * GET /api/customer/:id/transactions
 * Get all transactions for a customer (across all their accounts)
 */
router.get('/:id/transactions', authenticateToken, requireSelfOrAdmin, async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  try {
    const result = await pool.query(
      `SELECT t.transaction_id, t.account_id, t.transaction_type, t.amount,
              t.transaction_time, t.status,
              at.type_name as account_type
       FROM Transactions t
       JOIN Account a ON t.account_id = a.account_id
       JOIN Account_Type at ON a.account_type_id = at.account_type_id
       WHERE a.customer_id = $1
       ORDER BY t.transaction_time DESC
       LIMIT $2`,
      [id, limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

/**
 * GET /api/customer/:id/profile
 * Get customer profile
 */
router.get('/:id/profile', authenticateToken, requireSelfOrAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM Customer WHERE customer_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customer profile.' });
  }
});

module.exports = router;