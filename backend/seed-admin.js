require('dotenv').config();

const bcrypt = require('bcrypt');
const { pool } = require('./db');

const adminUser = {
  name: 'System Admin',
  email: 'admin@tms.com',
  password: 'Admin@1234',
  role: 'Admin',
};

const seedAdmin = async () => {
  if (!pool) {
    throw new Error('DATABASE_URL is undefined. Add your Neon connection string to backend/.env.');
  }

  const passwordHash = await bcrypt.hash(adminUser.password, 12);

  const result = await pool.query(
    `
      INSERT INTO users (name, email, password_hash, role, is_active, must_reset_password)
      VALUES ($1, $2, $3, $4, TRUE, TRUE)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_active = TRUE,
        must_reset_password = TRUE
      RETURNING id, name, email, role, is_active, must_reset_password, created_at;
    `,
    [adminUser.name, adminUser.email, passwordHash, adminUser.role]
  );

  console.log('Admin user is ready:');
  console.log(result.rows[0]);
};

seedAdmin()
  .catch((error) => {
    console.error('Failed to seed admin user:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (pool) {
      await pool.end();
    }
  });
