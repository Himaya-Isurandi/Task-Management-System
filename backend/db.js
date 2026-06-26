require('dotenv').config();

const { Pool } = require('pg');

const missingDatabaseUrlError = 'DATABASE_URL is required. Add it to Railway environment variables.';

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : {
      query: async () => {
        throw new Error(missingDatabaseUrlError);
      },
      connect: (callback) => {
        callback(new Error(missingDatabaseUrlError));
      },
      on: () => {},
    };

if (process.env.DATABASE_URL) {
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
} else {
  console.error(missingDatabaseUrlError);
}

pool.pool = pool;

module.exports = pool;
