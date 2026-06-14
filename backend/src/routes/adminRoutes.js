const router = require('express').Router();
const { body } = require('express-validator');
const { sendBroadcast } = require('../controllers/adminController');
const { authenticate, authorize, checkPasswordReset } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate, checkPasswordReset);

/**
 * @swagger
 * /api/admin/broadcast:
 *   post:
 *     summary: Send an announcement notification to all users (Admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               message:
 *                 type: string
 *               role:
 *                 type: string
 *                 description: Optional - target a specific role only
 *     responses:
 *       201:
 *         description: Broadcast sent
 */
router.post('/broadcast',
  authorize('Admin'),
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('role').optional().isIn(['Admin', 'Project Manager', 'Collaborator']),
    validate,
  ],
  sendBroadcast
);

module.exports = router;
