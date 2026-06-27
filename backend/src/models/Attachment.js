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
    field: 'file_name',
  },
  filePath: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'file_url',
  },
  fileType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'file_type',
  },
  fileSize: {
    type: DataTypes.INTEGER, // bytes
    allowNull: true,
    field: 'file_size',
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'tasks', key: 'id' },
    field: 'task_id',
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    field: 'user_id',
  },
}, {
  tableName: 'attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Attachment;
