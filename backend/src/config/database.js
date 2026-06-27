const { Sequelize } = require('sequelize');
require('dotenv').config();

// Force Vercel bundler to include postgres drivers in the serverless build
const pg = require('pg');
require('pg-hstore');

const useSQLite = process.env.DB_DIALECT === 'sqlite';
const isProduction = process.env.NODE_ENV === 'production';
const enableSqlLogging = process.env.DB_LOGGING === 'true';
const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || '';
const databaseUrlProtocol = (() => {
  try {
    return databaseUrl ? new URL(databaseUrl).protocol.replace(':', '') : '';
  } catch (error) {
    return '';
  }
})();
const isDatabaseUrl =
  databaseUrlProtocol === 'postgres' ||
  databaseUrlProtocol === 'postgresql' ||
  databaseUrlProtocol === 'mysql' ||
  databaseUrlProtocol === 'mariadb';

const normalizeDatabaseUrl = (url) => {
  if (!url || (databaseUrlProtocol !== 'postgres' && databaseUrlProtocol !== 'postgresql')) {
    return url;
  }

  const parsed = new URL(url);
  if (parsed.searchParams.get('sslmode') === 'require' && !parsed.searchParams.has('uselibpqcompat')) {
    parsed.searchParams.set('uselibpqcompat', 'true');
  }

  return parsed.toString();
};

let sequelize;

if (databaseUrl && isDatabaseUrl) {
  const isPostgres = databaseUrlProtocol === 'postgres' || databaseUrlProtocol === 'postgresql';
  sequelize = new Sequelize(normalizeDatabaseUrl(databaseUrl), {
    dialect: isPostgres ? 'postgres' : 'mysql',
    dialectModule: isPostgres ? pg : undefined,
    logging: enableSqlLogging ? console.log : false,
    dialectOptions: (isProduction || isPostgres) ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {}
  });
} else if (useSQLite) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: enableSqlLogging ? console.log : false,
  });
} else {
  if (databaseUrl && !isDatabaseUrl) {
    console.warn('Ignoring DATABASE_URL because it is not a database connection string. Falling back to DB_* settings.');
  }

  const dialect = process.env.DB_DIALECT || 'mysql';
  sequelize = new Sequelize(
    process.env.DB_NAME || process.env.MYSQLDATABASE,
    process.env.DB_USER || process.env.MYSQLUSER,
    process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    {
      host: process.env.DB_HOST || process.env.MYSQLHOST,
      port: process.env.DB_PORT || process.env.MYSQLPORT || (dialect === 'postgres' ? 5432 : 3306),
      dialect: dialect,
      dialectModule: dialect === 'postgres' ? pg : undefined,
      logging: enableSqlLogging ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: (isProduction && dialect === 'postgres') ? {
        ssl: {
          rejectUnauthorized: false
        }
      } : {}
    }
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    const isTest = process.env.NODE_ENV === 'test';
    await sequelize.sync({ force: isTest ? true : false, alter: process.env.DB_ALTER === 'true' });
    console.log('✅ Database synced');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

module.exports = { sequelize, connectDB };
