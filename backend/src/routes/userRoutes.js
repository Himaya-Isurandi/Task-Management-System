const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getUsers, getUserById, createUser, updateUser, deactivateUser } = require('../controllers/userController');

router.get('/',       authenticate, authorize('Admin'), getUsers);
router.get('/:id',    authenticate, authorize('Admin'), getUserById);
router.post('/',      authenticate, authorize('Admin'), createUser);
router.put('/:id',    authenticate, authorize('Admin'), updateUser);
router.delete('/:id', authenticate, authorize('Admin'), deactivateUser);

module.exports = router;
