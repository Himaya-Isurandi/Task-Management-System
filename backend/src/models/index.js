const User = require('./User');
const Task = require('./Task');
const Comment = require('./Comment');
const Notification = require('./Notification');
const Attachment = require('./Attachment');
const Project = require('./Project');
const Otp = require('./Otp');

// Associations
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
Task.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assignedTo' });
User.hasMany(Task, { as: 'createdTasks', foreignKey: 'createdBy' });

Comment.belongsTo(Task, { foreignKey: 'taskId' });
Comment.belongsTo(User, { foreignKey: 'userId' });
Task.hasMany(Comment, { foreignKey: 'taskId' });

Notification.belongsTo(User, { foreignKey: 'userId' });
Notification.belongsTo(Task, { foreignKey: 'taskId' });

// NEW: Attachment associations
Attachment.belongsTo(Task, { foreignKey: 'taskId' });
Attachment.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedBy' });
Task.hasMany(Attachment, { foreignKey: 'taskId' });

// Project associations
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
User.hasMany(Project, { foreignKey: 'managerId', as: 'managedProjects' });

module.exports = { User, Task, Comment, Notification, Attachment, Project, Otp };
