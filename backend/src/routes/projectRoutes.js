const router = require('express').Router();
const { body } = require('express-validator');
const { getProjects, getProjectById, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { authenticate, authorize, checkPasswordReset } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate, checkPasswordReset);

router.get('/', getProjects);
router.get('/:id', getProjectById);

router.post('/',
  authorize('Admin', 'Project Manager'),
  [
    body('name').notEmpty().withMessage('Project name is required'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('status').optional().isIn(['To Do', 'In Progress', 'Completed']).withMessage('Invalid status'),
    validate,
  ],
  createProject
);

router.put('/:id',
  authorize('Admin', 'Project Manager'),
  [
    body('name').optional().notEmpty().withMessage('Project name cannot be empty'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('status').optional().isIn(['To Do', 'In Progress', 'Completed']).withMessage('Invalid status'),
    validate,
  ],
  updateProject
);

router.delete('/:id',
  authorize('Admin', 'Project Manager'),
  deleteProject
);

module.exports = router;
