const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  message: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('task_assigned', 'status_changed', 'comment_added', 'deadline_approaching', 'admin_update'),
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'tasks', key: 'id' },
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

module.exports = Notification;
