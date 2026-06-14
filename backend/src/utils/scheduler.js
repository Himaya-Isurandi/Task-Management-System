const { Op } = require('sequelize');
const { Task, Notification } = require('../models');
const { notifyUser } = require('./websocket');

/**
 * Checks for tasks due within the next 24 hours that haven't
 * been notified yet, and creates "approaching deadline" notifications.
 * Run this on a schedule (e.g., every hour) via setInterval or node-cron.
 */
const checkApproachingDeadlines = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find tasks due today or tomorrow that are not yet completed
    const tasks = await Task.findAll({
      where: {
        dueDate: { [Op.between]: [todayStr, tomorrowStr] },
        status: { [Op.ne]: 'Completed' },
        assignedTo: { [Op.ne]: null },
      },
    });

    for (const task of tasks) {
      // Avoid duplicate notifications: check if one was already sent today
      const existing = await Notification.findOne({
        where: {
          taskId: task.id,
          type: 'deadline_approaching',
          createdAt: { [Op.gte]: new Date(now.setHours(0, 0, 0, 0)) },
        },
      });
      if (existing) continue;

      const notification = await Notification.create({
        userId: task.assignedTo,
        message: `Task "${task.title}" is due on ${task.dueDate}`,
        type: 'deadline_approaching',
        taskId: task.id,
      });

      notifyUser(task.assignedTo, { type: 'deadline_approaching', notification });
    }

    console.log(`✅ Deadline check complete — ${tasks.length} task(s) checked`);
  } catch (error) {
    console.error('Deadline check failed:', error.message);
  }
};

// Starts the recurring job (every hour)
const startDeadlineScheduler = () => {
  // Run once on startup, then every hour
  checkApproachingDeadlines();
  setInterval(checkApproachingDeadlines, 60 * 60 * 1000); // 1 hour
  console.log('✅ Deadline notification scheduler started (runs hourly)');
};

module.exports = { startDeadlineScheduler, checkApproachingDeadlines };
