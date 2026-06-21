const router = require('express').Router();
const { body } = require('express-validator');
const { getUsers, getUserById, createUser, updateUser, deactivateUser } = require('../controllers/userController');
const { authenticate, authorize, checkPasswordReset } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All user routes require authentication
router.use(authenticate, checkPasswordReset);

// Admin only routes
router.get('/', authorize('Admin', 'Project Manager'), getUsers);
router.post('/',
  authorize('Admin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('role').isIn(['Admin', 'Project Manager', 'Collaborator']).withMessage('Invalid role'),
    validate,
  ],
  createUser
);
router.get('/:id', authorize('Admin'), getUserById);
router.put('/:id', authorize('Admin'), updateUser);
router.delete('/:id', authorize('Admin'), deactivateUser);

module.exports = router;
