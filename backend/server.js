require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const bankingRoutes  = require('./routes/banking');
const adminRoutes    = require('./routes/admin');

app.use('/api', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api', bankingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏦 Banking System API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Seed passwords: POST http://localhost:${PORT}/api/seed-passwords\n`);
});

module.exports = app;