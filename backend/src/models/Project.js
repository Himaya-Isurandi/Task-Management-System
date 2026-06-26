const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('To Do', 'In Progress', 'Completed'),
    defaultValue: 'To Do',
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  // Virtual stage mapping for frontend compatibility
  stage: {
    type: DataTypes.VIRTUAL,
    get() {
      const status = this.getDataValue('status');
      if (status === 'To Do') return 'Planning';
      if (status === 'In Progress') return 'Execution';
      if (status === 'Completed') return 'Completed';
      return status;
    }
  }
}, {
  tableName: 'projects',
  timestamps: true,
});

module.exports = Project;
