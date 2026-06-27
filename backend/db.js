require('dotenv').config();

const { Pool } = require('pg');

const missingDatabaseUrlError = 'DATABASE_URL is required. Add it to Railway environment variables.';
const databaseUrl = process.env.DATABASE_URL || '';
const isPostgresUrl = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
const invalidDatabaseUrlError = 'DATABASE_URL must be a PostgreSQL connection string, not an app URL.';

const normalizePostgresUrl = (url) => {
  if (!isPostgresUrl) return url;

  const parsed = new URL(url);
  if (parsed.searchParams.get('sslmode') === 'require' && !parsed.searchParams.has('uselibpqcompat')) {
    parsed.searchParams.set('uselibpqcompat', 'true');
  }

  return parsed.toString();
};

const pool = isPostgresUrl
  ? new Pool({
      connectionString: normalizePostgresUrl(databaseUrl),
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : {
      query: async () => {
        throw new Error(databaseUrl ? invalidDatabaseUrlError : missingDatabaseUrlError);
      },
      connect: (callback) => {
        callback(new Error(databaseUrl ? invalidDatabaseUrlError : missingDatabaseUrlError));
      },
      on: () => {},
    };

if (isPostgresUrl) {
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
} else if (databaseUrl) {
  console.error(invalidDatabaseUrlError);
} else {
  console.error(missingDatabaseUrlError);
}

pool.pool = pool;

module.exports = pool;
