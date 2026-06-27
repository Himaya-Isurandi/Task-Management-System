require('dotenv').config();

const { connectDB, sequelize } = require('./src/config/database');
const { User } = require('./src/models');

const adminUser = {
  name: 'System Admin',
  email: 'admin@tms.com',
  password: 'Admin@1234',
  role: 'Admin',
};

const seedAdmin = async () => {
  await connectDB();

  const existing = await User.findOne({ where: { email: adminUser.email } });

  if (existing) {
    await existing.update({
      name: adminUser.name,
      password: adminUser.password,
      role: adminUser.role,
      isActive: true,
      mustResetPassword: true,
    });
    console.log('Admin user is ready (updated):');
    console.log(existing.toJSON());
  } else {
    const created = await User.create({
      name: adminUser.name,
      email: adminUser.email,
      password: adminUser.password,
      role: adminUser.role,
      isActive: true,
      mustResetPassword: true,
    });
    console.log('Admin user is ready (created):');
    console.log(created.toJSON());
  }
};

seedAdmin()
  .catch((error) => {
    console.error('Failed to seed admin user:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });
