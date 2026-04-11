const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../db');
const { generateToken, authenticateToken } = require('../middleware/auth');

/**
 * POST /api/login
 * Authenticate user and return JWT
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const result = await pool.query(
      `SELECT u.*, c.first_name, c.last_name, c.email
       FROM Users u
       LEFT JOIN Customer c ON u.customer_id = c.customer_id
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      customer_id: user.customer_id,
    });

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        customer_id: user.customer_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/me
 * Get current authenticated user info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.role, u.customer_id,
              c.first_name, c.last_name, c.email, c.phone, c.address
       FROM Users u
       LEFT JOIN Customer c ON u.customer_id = c.customer_id
       WHERE u.user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/register-customer-user
 * Admin creates a login for an existing customer
 */
router.post('/register-customer-user', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only.' });
  }

  const { username, password, customer_id } = req.body;
  if (!username || !password || !customer_id) {
    return res.status(400).json({ error: 'Username, password, and customer_id are required.' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO Users (username, password, role, customer_id)
       VALUES ($1, $2, 'customer', $3) RETURNING user_id, username, role, customer_id`,
      [username, hashed, customer_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Utility: seed proper bcrypt passwords for demo users
router.post('/seed-passwords', async (req, res) => {
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('pass123', 10);

    await pool.query(`UPDATE Users SET password = $1 WHERE username = 'admin'`, [adminHash]);
    await pool.query(`UPDATE Users SET password = $1 WHERE username != 'admin'`, [userHash]);

    res.json({ message: 'Passwords seeded. admin=admin123, others=pass123' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;