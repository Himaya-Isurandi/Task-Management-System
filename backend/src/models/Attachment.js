const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  fileType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  fileSize: {
    type: DataTypes.INTEGER, // bytes
    allowNull: true,
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'tasks', key: 'id' },
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'attachments',
  timestamps: true,
});

module.exports = Attachment;
