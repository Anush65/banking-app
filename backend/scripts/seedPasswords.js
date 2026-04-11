/**
 * Run this script ONCE after loading schema.sql to set correct bcrypt passwords.
 * Usage: node scripts/seedPasswords.js
 */
require('dotenv').config({ path: `${__dirname}/../.env` });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function seed() {
  try {
    console.log('🔐 Seeding passwords...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash  = await bcrypt.hash('pass123', 10);

    await pool.query(`UPDATE Users SET password = $1 WHERE username = 'admin'`, [adminHash]);
    await pool.query(`UPDATE Users SET password = $1 WHERE username != 'admin'`, [userHash]);

    console.log('✅ Done! Passwords set:');
    console.log('   admin     → admin123');
    console.log('   customer1 → pass123');
    console.log('   customer2 → pass123');
    console.log('   customer3 → pass123');
    console.log('   customer4 → pass123');
    console.log('   customer5 → pass123');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();