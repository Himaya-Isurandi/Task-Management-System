const { Sequelize } = require('sequelize');
require('dotenv').config();

// Force Vercel bundler to include postgres drivers in the serverless build
const pg = require('pg');
require('pg-hstore');

const useSQLite = process.env.DB_DIALECT === 'sqlite';
const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (process.env.DATABASE_URL) {
  const isPostgres = process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: isPostgres ? 'postgres' : 'mysql',
    dialectModule: isPostgres ? pg : undefined,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else {
  const dialect = process.env.DB_DIALECT || 'mysql';
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || (dialect === 'postgres' ? 5432 : 3306),
      dialect: dialect,
      dialectModule: dialect === 'postgres' ? pg : undefined,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
    if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = { sequelize, connectDB };
