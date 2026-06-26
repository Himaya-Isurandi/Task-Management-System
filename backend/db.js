require('dotenv').config();

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add it to Railway environment variables.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect((error, client, release) => {
  if (error) {
    console.error('Database connection failed:', error.message);
    return;
  }

  console.log('Connected to Neon PostgreSQL database');
  release();
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

pool.pool = pool;

module.exports = pool;
