const router = require('express').Router();
const { body } = require('express-validator');
const { getTasks, getTaskById, createTask, updateTask, deleteTask, addComment, addAttachment } = require('../controllers/taskController');
const { authenticate, authorize, checkPasswordReset } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management and operations
 */

router.use(authenticate, checkPasswordReset);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Retrieve list of tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of tasks
 */
router.get('/', getTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task details
 */
router.get('/:id', getTaskById);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Task created
 */
router.post('/',
  authorize('Admin', 'Project Manager'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('status').optional().isIn(['To Do', 'In Progress', 'Completed']).withMessage('Invalid status'),
    body('dueDate').optional().custom((value) => {
      if (value) {
        const due = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (due < today) {
          throw new Error('Due date cannot be in the past');
        }
      }
      return true;
    }),
    validate,
  ],
  createTask
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task updated
 *   patch:
 *     summary: Partially update a task (e.g. status)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task patched
 */
router.put('/:id', 
  (req, res, next) => {
    // Project Manager and Admin: full update
    // Collaborator: can ONLY update status field
    next();
  },
  updateTask
);
router.patch('/:id', 
  (req, res, next) => {
    // Project Manager and Admin: full update
    // Collaborator: can ONLY update status field
    next();
  },
  updateTask
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted
 */
router.delete('/:id', authorize('Admin', 'Project Manager'), deleteTask);

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post('/:id/comments',
  [
    body('content').notEmpty().withMessage('Comment content required'),
    validate,
  ],
  addComment
);

/**
 * @swagger
 * /api/tasks/{id}/attachments:
 *   post:
 *     summary: Add an attachment to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Attachment uploaded
 */
router.post('/:id/attachments', upload.single('file'), addAttachment);

module.exports = router;
