const { User, Notification } = require('../models');
const { notifyUser } = require('../utils/websocket');

// POST /api/admin/broadcast  — Admin sends an announcement to all (or some) users
const sendBroadcast = async (req, res) => {
  try {
    const { message, role } = req.body; // role optional: target a specific role

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ errorCode: 'VALIDATION_ERROR', message: 'Message is required' });
    }

    const where = { isActive: true };
    if (role) where.role = role;

    const users = await User.findAll({ where, attributes: ['id'] });

    const notifications = await Promise.all(
      users.map(u =>
        Notification.create({
          userId: u.id,
          message,
          type: 'admin_update',
        })
      )
    );

    // Push in real-time to connected users
    notifications.forEach((n, i) => {
      notifyUser(users[i].id, { type: 'admin_update', notification: n });
    });

    res.status(201).json({ message: `Broadcast sent to ${users.length} user(s)` });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

module.exports = { sendBroadcast };
