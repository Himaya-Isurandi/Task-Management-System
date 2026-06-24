require('dotenv').config();
const { connectDB } = require('./src/config/database');
const { User } = require('./src/models');

const testUsers = [
  { name: 'System Admin',       email: 'admin@tms.com',         password: 'Admin@1234',   role: 'Admin' },
   { name: 'Test Manager',       email: 'manager@tms.com',       password: 'Manager@1234', role: 'Project Manager' },
  { name: 'Test Collaborator',  email: 'collaborator@tms.com',  password: 'Collab@1234',  role: 'Collaborator' },
];

const seed = async () => {
  console.log('\n🌱 Starting database seed...\n');
  await connectDB();

  for (const u of testUsers) {
    const existing = await User.findOne({ where: { email: u.email } });
    if (existing) {
      console.log(`ℹ️  ${u.role} already exists (${u.email}) — skipping`);
      continue;
    }

    await User.create({
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      mustResetPassword: false,   // Seeded users skip forced reset
    });

    console.log(`✅ Created ${u.role}`);
    console.log(`   Email:    ${u.email}`);
    console.log(`   Password: ${u.password}`);
  }

  console.log('\n⚠️  These are DEV-only accounts — remove before production!\n');
  console.log('📝 Note: 2FA codes are printed in the backend console during development.\n');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
