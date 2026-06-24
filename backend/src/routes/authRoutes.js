const router = require('express').Router();
const { body } = require('express-validator');
const { login, refresh, logout, resetPassword, getMe, verify2fa, updateProfile, changePassword } = require('../controllers/authController');
const { authenticate, checkPasswordReset } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    validate,
  ],
  login
);

router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/reset-password',
  authenticate,
  [
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    validate,
  ],
  resetPassword
);

// 2FA and Profile endpoints
router.post('/2fa/verify',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
    validate,
  ],
  verify2fa
);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, checkPasswordReset, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain lowercase, uppercase, and a number'),
  validate
], changePassword);

module.exports = router;
