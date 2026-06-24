const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

async function cleanIndexes() {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query(`
      SELECT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'users' 
      AND INDEX_NAME LIKE 'email%'
      AND INDEX_NAME != 'email';
    `);

    for (let row of results) {
      console.log(`Dropping index ${row.INDEX_NAME}`);
      await sequelize.query(`ALTER TABLE users DROP INDEX \`${row.INDEX_NAME}\`;`);
    }
    
    const [resultsPhone] = await sequelize.query(`
      SELECT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'users' 
      AND INDEX_NAME LIKE 'phone%'
      AND INDEX_NAME != 'phone';
    `);

    for (let row of resultsPhone) {
      console.log(`Dropping index ${row.INDEX_NAME}`);
      await sequelize.query(`ALTER TABLE users DROP INDEX \`${row.INDEX_NAME}\`;`);
    }

    console.log('Cleanup done.');
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

cleanIndexes();
