const { Task, User, Comment, Notification, Project, Attachment } = require('../models');
const { notifyUser } = require('../utils/websocket');
const { Op } = require('sequelize');

const taskIncludes = [
  { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
];

// GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, search, page = 1, limit = 20 } = req.query;
    const where = {};

    // Collaborators only see tasks assigned to them
    if (req.user.role === 'Collaborator') {
      where.assignedTo = req.user.id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (search) where.title = { [Op.like]: `%${search}%` };

    const offset = (page - 1) * limit;
    const { count, rows } = await Task.findAndCountAll({
      where,
      include: taskIncludes,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({ tasks: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        ...taskIncludes,
        { model: Comment, include: [{ model: User, attributes: ['id', 'name'] }] },
      ],
    });
    if (!task) return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Task not found' });

    // Collaborators can only see their own tasks
    if (req.user.role === 'Collaborator' && task.assignedTo !== req.user.id) {
      return res.status(403).json({ errorCode: 'FORBIDDEN', message: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority, status } = req.body;

    if (assignedTo) {
      const assignee = await User.findByPk(assignedTo);
      if (!assignee) return res.status(400).json({ errorCode: 'INVALID_USER', message: 'Assigned user not found' });
    }

    const task = await Task.create({
      title, description, assignedTo, dueDate, priority, status,
      createdBy: req.user.id,
    });

    const fullTask = await Task.findByPk(task.id, { include: taskIncludes });

    // Real-time notification to assigned user
    if (assignedTo) {
      const notification = await Notification.create({
        userId: assignedTo,
        message: `You have been assigned a new task: "${title}"`,
        type: 'task_assigned',
        taskId: task.id,
      });
      notifyUser(assignedTo, { type: 'task_assigned', notification, task: fullTask });
    }

    res.status(201).json({ message: 'Task created successfully', task: fullTask });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Task not found' });

    const userRole = req.user.role;
    const oldStatus = task.status;

    if (userRole === 'Collaborator') {
      if (task.assignedTo !== req.user.id) {
        return res.status(403).json({ errorCode: 'FORBIDDEN', message: 'Access denied' });
      }
      const { status, ...otherFields } = req.body;
      if (Object.keys(otherFields).length > 0 || !status) {
        return res.status(400).json({ errorCode: 'FORBIDDEN_FIELDS', message: 'Collaborators can only update task status' });
      }
      const allowedStatuses = ['To Do', 'In Progress', 'Completed'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ errorCode: 'INVALID_STATUS', message: 'Invalid status value' });
      }
      task.status = status;
      await task.save();
      
      const updatedTask = await Task.findByPk(task.id, { include: taskIncludes });
      
      // Notify project manager of status change
      const project = await Project.findByPk(task.projectId);
      if (project && project.managerId) {
        const notification = await Notification.create({
          userId: project.managerId,
          message: `Task "${task.title}" status changed to ${status} by ${req.user.name}`,
          type: 'status_changed',
          taskId: task.id,
        });
        notifyUser(project.managerId, { type: 'status_changed', notification, task: updatedTask });
      }
      
      return res.json({ message: 'Task updated successfully', task: updatedTask });
    }

    // Admin / Project Manager: full update allowed
    const { title, description, priority, status, dueDate, assignedTo, projectId } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (projectId !== undefined) task.projectId = projectId;
    await task.save();

    const updatedTask = await Task.findByPk(task.id, { include: taskIncludes });

    // Notify assignee of status change or assignment
    if (assignedTo !== undefined && assignedTo !== task.assignedTo) {
      const notification = await Notification.create({
        userId: assignedTo,
        message: `You have been assigned a new task: "${task.title}"`,
        type: 'task_assigned',
        taskId: task.id,
      });
      notifyUser(assignedTo, { type: 'task_assigned', notification, task: updatedTask });
    } else if (task.assignedTo && status !== undefined && status !== oldStatus) {
      const notification = await Notification.create({
        userId: task.assignedTo,
        message: `Task "${task.title}" status changed to ${status}`,
        type: 'status_changed',
        taskId: task.id,
      });
      notifyUser(task.assignedTo, { type: 'status_changed', notification, task: updatedTask });
    }

    res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Task not found' });

    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/tasks/:id/comments
const addComment = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Task not found' });

    const comment = await Comment.create({
      content: req.body.content,
      taskId: task.id,
      userId: req.user.id,
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, attributes: ['id', 'name'] }],
    });

    // Notify task assignee
    if (task.assignedTo && task.assignedTo !== req.user.id) {
      const notification = await Notification.create({
        userId: task.assignedTo,
        message: `New comment on task "${task.title}"`,
        type: 'comment_added',
        taskId: task.id,
      });
      notifyUser(task.assignedTo, { type: 'comment_added', notification });
    }

    res.status(201).json({ message: 'Comment added', comment: fullComment });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/tasks/:id/attachments
const addAttachment = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Task not found' });
    if (!req.file) return res.status(400).json({ errorCode: 'NO_FILE', message: 'No file uploaded' });

    const attachment = await Attachment.create({
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      taskId: task.id,
      uploadedBy: req.user.id,
    });

    res.status(201).json({ message: 'Attachment uploaded', attachment });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask, addComment, addAttachment };
