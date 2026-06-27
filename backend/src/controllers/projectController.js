const { Project, Task, User } = require('../models');

// Helper to format a single project with tasks, progress, and team
const formatProject = (project) => {
  const tasks = project.tasks || [];
  
  // Calculate progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Compile team (manager + unique task assignees)
  const teamMap = new Map();

  // Add manager if exists
  if (project.manager) {
    teamMap.set(project.manager.id, {
      id: `tm-${project.manager.id}`,
      userId: project.manager.id,
      name: project.manager.name,
      role: 'Manager',
      status: project.manager.isActive ? 'Active' : 'Inactive',
      tasksAssigned: 0,
      completed: 0,
      inProgress: 0,
      onTimePct: 100
    });
  }

  // Add task assignees
  tasks.forEach(task => {
    if (task.assignee) {
      const assignee = task.assignee;
      if (!teamMap.has(assignee.id)) {
        teamMap.set(assignee.id, {
          id: `tm-${assignee.id}`,
          userId: assignee.id,
          name: assignee.name,
          role: assignee.role || 'Collaborator',
          status: assignee.isActive ? 'Active' : 'Inactive',
          tasksAssigned: 0,
          completed: 0,
          inProgress: 0,
          onTimePct: 100
        });
      }
      
      const member = teamMap.get(assignee.id);
      member.tasksAssigned += 1;
      if (task.status === 'Completed') {
        member.completed += 1;
      } else if (task.status === 'In Progress') {
        member.inProgress += 1;
      }
    }
  });

  // Calculate onTimePct for each team member
  teamMap.forEach(member => {
    if (member.tasksAssigned > 0) {
      member.onTimePct = Math.round((member.completed / member.tasksAssigned) * 100);
    }
  });

  return {
    id: project.id,
    name: project.name,
    status: project.status,
    priority: project.priority,
    startDate: project.startDate,
    endDate: project.endDate,
    progress,
    stage: project.stage,
    manager: project.manager ? project.manager.name : 'Unassigned',
    managerId: project.managerId,
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      assigneeId: t.assignedTo,
      assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, role: t.assignee.role } : null
    })),
    team: Array.from(teamMap.values())
  };
};

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    let projects;
    
    // Collaborator permissions: see only projects containing their tasks
    if (req.user.role === 'Collaborator') {
      const assignedTasks = await Task.findAll({
        where: { assignedTo: req.user.id },
        attributes: ['projectId']
      });
      const projectIds = [...new Set(assignedTasks.map(t => t.projectId).filter(id => id !== null))];
      
      projects = await Project.findAll({
        where: { id: projectIds },
        include: [
          {
            model: Task,
            as: 'tasks',
            include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role', 'isActive'] }]
          },
          { model: User, as: 'manager', attributes: ['id', 'name', 'email', 'isActive'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      // Admins and Project Managers can see all projects
      projects = await Project.findAll({
        include: [
          {
            model: Task,
            as: 'tasks',
            include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role', 'isActive'] }]
          },
          { model: User, as: 'manager', attributes: ['id', 'name', 'email', 'isActive'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    const formatted = projects.map(formatProject);
    res.json({ projects: formatted });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: Task,
          as: 'tasks',
          include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role', 'isActive'] }]
        },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email', 'isActive'] }
      ]
    });

    if (!project) {
      return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Project not found' });
    }

    // Collaborators can only access their assigned projects
    if (req.user.role === 'Collaborator') {
      const isAssigned = project.tasks.some(t => t.assignedTo === req.user.id);
      if (!isAssigned) {
        return res.status(403).json({ errorCode: 'FORBIDDEN', message: 'Access denied' });
      }
    }

    res.json({ project: formatProject(project) });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, status, priority, startDate, endDate, managerId } = req.body;

    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager) {
        return res.status(400).json({ errorCode: 'INVALID_USER', message: 'Manager user not found' });
      }
    }

    const project = await Project.create({
      name,
      status,
      priority,
      startDate,
      endDate,
      managerId
    });

    const fullProject = await Project.findByPk(project.id, {
      include: [
        { model: Task, as: 'tasks' },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email', 'isActive'] }
      ]
    });

    res.status(201).json({ message: 'Project created successfully', project: formatProject(fullProject) });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Project not found' });
    }

    const { name, status, priority, startDate, endDate, managerId } = req.body;
    
    if (managerId !== undefined) {
      if (managerId) {
        const manager = await User.findByPk(managerId);
        if (!manager) {
          return res.status(400).json({ errorCode: 'INVALID_USER', message: 'Manager user not found' });
        }
      }
      project.managerId = managerId;
    }

    if (name !== undefined) project.name = name;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;

    await project.save();

    const fullProject = await Project.findByPk(project.id, {
      include: [
        {
          model: Task,
          as: 'tasks',
          include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role', 'isActive'] }]
        },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email', 'isActive'] }
      ]
    });

    res.json({ message: 'Project updated successfully', project: formatProject(fullProject) });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Project not found' });
    }

    // Unset projectId for tasks in this project
    await Task.update({ projectId: null }, { where: { projectId: project.id } });

    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
