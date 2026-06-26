const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'password_hash',
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Project Manager', 'Collaborator'),
    allowNull: false,
    defaultValue: 'Collaborator',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  mustResetPassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'must_reset_password',
  },
  resetOtpHash: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'reset_otp_hash',
  },
  resetOtpExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reset_otp_expires_at',
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  delete values.refreshToken;
  delete values.resetOtpHash;
  delete values.resetOtpExpiresAt;
  return values;
};

module.exports = User;
