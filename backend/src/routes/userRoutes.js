const express = require('express');
const router = express.Router();
const { authenticate, authorize, checkPasswordReset } = require('../middleware/auth');
const { getUsers, getUserById, createUser, updateUser, deactivateUser, resendInvitation } = require('../controllers/userController');

router.use(authenticate, checkPasswordReset, authorize('Admin'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.post('/:id/resend-invitation', resendInvitation);
router.put('/:id', updateUser);
router.delete('/:id', deactivateUser);

module.exports = router;
