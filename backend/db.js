const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,  // Increased for NeonDB (10 seconds)
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('✅ PostgreSQL connected successfully');
    done();
  }
});

module.exports = pool;