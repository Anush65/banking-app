const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'banking_secret_key_change_in_production';

/**
 * Verify JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Restrict access to admin role only
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

/**
 * Restrict access to customer role only
 */
const requireCustomer = (req, res, next) => {
  if (req.user?.role !== 'customer') {
    return res.status(403).json({ error: 'Access denied. Customer role required.' });
  }
  next();
};

/**
 * Allow admin OR the customer themselves
 */
const requireSelfOrAdmin = (req, res, next) => {
  const { role, customer_id } = req.user;
  const requestedId = parseInt(req.params.id);

  if (role === 'admin' || customer_id === requestedId) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied.' });
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCustomer,
  requireSelfOrAdmin,
  generateToken,
};