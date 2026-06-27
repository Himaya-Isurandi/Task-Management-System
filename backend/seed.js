require('dotenv').config();
process.env.DB_ALTER = process.env.DB_ALTER || 'false';

const bcrypt = require('bcryptjs');
const pool = require('./db');
const { connectDB } = require('./src/config/database');
const { User } = require('./src/models');

const testUsers = [
  { name: 'System Admin', email: 'admin@tms.com', password: 'Admin@1234', role: 'Admin' },
  { name: 'Test Manager', email: 'manager@tms.com', password: 'Manager@1234', role: 'Project Manager' },
  { name: 'Test Collaborator', email: 'collaborator@tms.com', password: 'Collab@1234', role: 'Collaborator' },
];

const prepareLegacyUsersTable = async () => {
  try {
    const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || '';
    const isPostgresUrl = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
    if (!isPostgresUrl) {
      console.log('Skipping legacy users table preparation (not a PostgreSQL database URL)');
      return;
    }

    const fallbackHash = await bcrypt.hash('ChangeMe@1234', 12);

    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
    await pool.query('UPDATE users SET password_hash = $1 WHERE password_hash IS NULL OR password_hash = $2', [fallbackHash, '']);
    await pool.query('ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL');

    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT false');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_hash VARCHAR(255)');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP WITH TIME ZONE');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "refreshToken" TEXT');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)');
  } catch (err) {
    console.warn('Warning: prepareLegacyUsersTable failed, proceeding anyway:', err.message);
  }
};

const seed = async () => {
  console.log('\nStarting database seed...\n');
  await prepareLegacyUsersTable();
  await connectDB();

  for (const u of testUsers) {
    const existing = await User.findOne({ where: { email: u.email } });

    if (existing) {
      await existing.update({
        name: u.name,
        password: u.password,
        role: u.role,
        isActive: true,
        mustResetPassword: false,
      });

      console.log(`Updated ${u.role}`);
      console.log(`   Email:    ${u.email}`);
      console.log(`   Password: ${u.password}`);
      continue;
    }

    await User.create({
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      mustResetPassword: false,
    });

    console.log(`Created ${u.role}`);
    console.log(`   Email:    ${u.email}`);
    console.log(`   Password: ${u.password}`);
  }

  console.log('\nThese are DEV-only accounts; remove before production.\n');
  console.log('Note: 2FA codes are printed in the backend console during development.\n');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
