const { User, Task, Comment, Notification, Attachment, Project, Otp } = require('../models');
const { sendWelcomeEmail } = require('../utils/email');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { sequelize } = require('../config/database');

const TEMP_PASSWORD_CHARS = {
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lower: 'abcdefghijkmnopqrstuvwxyz',
  number: '23456789',
  symbol: '!@#$%^&*?'
};

const shuffle = (chars) => {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};

const generateTemporaryPassword = (length = 14) => {
  const requiredChars = [
    TEMP_PASSWORD_CHARS.upper[crypto.randomInt(TEMP_PASSWORD_CHARS.upper.length)],
    TEMP_PASSWORD_CHARS.lower[crypto.randomInt(TEMP_PASSWORD_CHARS.lower.length)],
    TEMP_PASSWORD_CHARS.number[crypto.randomInt(TEMP_PASSWORD_CHARS.number.length)],
    TEMP_PASSWORD_CHARS.symbol[crypto.randomInt(TEMP_PASSWORD_CHARS.symbol.length)]
  ];
  const allChars = Object.values(TEMP_PASSWORD_CHARS).join('');

  while (requiredChars.length < length) {
    requiredChars.push(allChars[crypto.randomInt(allChars.length)]);
  }

  return shuffle(requiredChars);
};

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;

    const offset = (page - 1) * limit;
    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      users: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/users
const createUser = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, email, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      await transaction.rollback();
      return res.status(400).json({ errorCode: 'EMAIL_EXISTS', message: 'Email already in use' });
    }

    const tempPassword = generateTemporaryPassword();

    const user = await User.create({
      name, email, role,
      password: tempPassword,
      mustResetPassword: true,
    }, { transaction });

    await sendWelcomeEmail(email, name, tempPassword);
    await transaction.commit();

    res.status(201).json({ message: `User created and invitation email sent to ${email}`, user });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/users/:id/resend-invitation
const resendInvitation = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(req.params.id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'User not found' });
    }

    if (!user.mustResetPassword) {
      await transaction.rollback();
      return res.status(400).json({
        errorCode: 'INVITATION_NOT_REQUIRED',
        message: 'This user has already changed their temporary password',
      });
    }

    const tempPassword = generateTemporaryPassword();
    user.password = tempPassword;
    user.mustResetPassword = true;
    await user.save({ transaction });

    await sendWelcomeEmail(user.email, user.name, tempPassword);
    await transaction.commit();

    res.json({ message: `Invitation email resent to ${user.email}` });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'User not found' });

    const { name, role, isActive } = req.body;
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// DELETE /api/users/:id (permanent delete)
const deactivateUser = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'User not found' });
    }

    const managedProjects = await Project.findAll({
      where: { managerId: user.id },
      attributes: ['id'],
      transaction,
    });
    const managedProjectIds = managedProjects.map(project => project.id);

    const taskWhere = {
      [Op.or]: [
        { assignedTo: user.id },
        { createdBy: user.id },
      ],
    };

    if (managedProjectIds.length > 0) {
      taskWhere[Op.or].push({ projectId: { [Op.in]: managedProjectIds } });
    }

    const relatedTasks = await Task.findAll({
      where: taskWhere,
      attributes: ['id'],
      transaction,
    });
    const relatedTaskIds = relatedTasks.map(task => task.id);

    const taskScopedWhere = relatedTaskIds.length > 0 ? { taskId: { [Op.in]: relatedTaskIds } } : null;

    await Notification.destroy({
      where: {
        [Op.or]: [
          { userId: user.id },
          ...(taskScopedWhere ? [taskScopedWhere] : []),
        ],
      },
      transaction,
    });

    await Attachment.destroy({
      where: {
        [Op.or]: [
          { uploadedBy: user.id },
          ...(taskScopedWhere ? [taskScopedWhere] : []),
        ],
      },
      transaction,
    });

    await Comment.destroy({
      where: {
        [Op.or]: [
          { userId: user.id },
          ...(taskScopedWhere ? [taskScopedWhere] : []),
        ],
      },
      transaction,
    });

    if (relatedTaskIds.length > 0) {
      await Task.destroy({
        where: { id: { [Op.in]: relatedTaskIds } },
        transaction,
      });
    }

    if (managedProjectIds.length > 0) {
      await Project.destroy({
        where: { id: { [Op.in]: managedProjectIds } },
        transaction,
      });
    }

    await Otp.destroy({
      where: { email: user.email },
      transaction,
    });

    await user.destroy({ transaction });
    await transaction.commit();

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deactivateUser, resendInvitation };
