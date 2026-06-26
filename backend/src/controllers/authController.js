const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { User, Otp } = require('../models');
const { send2faEmail, sendPasswordResetCodeEmail } = require('../utils/email');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
};

const generateSixDigitOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

const validatePasswordPolicy = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
const passwordPolicyMessage = 'Password must be at least 8 characters with lowercase, uppercase, a number, and a symbol';

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // Check rate limit: max 3 requests per email per 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const count = await Otp.count({
      where: {
        email,
        createdAt: { [Op.gte]: fifteenMinutesAgo }
      }
    });

    if (count >= 3) {
      return res.status(429).json({
        errorCode: 'RATE_LIMIT',
        message: 'Too many 2FA code requests. Please wait up to 15 minutes before requesting again.'
      });
    }

    // Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // Log to console in dev
    console.log(`\n==========================================`);
    console.log(`[DEV 2FA] Email: ${email}`);
    console.log(`[DEV 2FA] Generated 6-digit code: ${otpCode}`);
    console.log(`==========================================\n`);

    // Hash the OTP code
    const hashedCode = await bcrypt.hash(otpCode, 12);

    // Save Otp record
    await Otp.create({
      email,
      code: hashedCode,
      expiresAt,
      purpose: '2fa'
    });

    // Send code to user's registered email using existing email transporter (skip during tests)
    if (process.env.NODE_ENV !== 'test') {
      try {
        await send2faEmail(email, otpCode);
      } catch (mailError) {
        console.error(`Failed to send 2FA email to ${email}:`, mailError.message);
      }
    }

    res.json({ message: '2FA code sent successfully', email });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/auth/2fa/verify
const verify2fa = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ errorCode: 'VALIDATION_ERROR', message: 'Email and 2FA code are required' });
    }

    // Find the latest active OTP for this email
    const otpRecord = await Otp.findOne({
      where: { email, purpose: '2fa' },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({ errorCode: 'INVALID_OTP', message: 'No 2FA code requested for this email' });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 5) {
      await otpRecord.destroy();
      return res.status(400).json({ errorCode: 'MAX_ATTEMPTS', message: 'Max verification attempts exceeded' });
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ errorCode: 'EXPIRED_OTP', message: '2FA code has expired' });
    }

    // Verify code
    const isMatch = await bcrypt.compare(code, otpRecord.code);
    if (!isMatch) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= 5) {
        await otpRecord.destroy();
        return res.status(400).json({ errorCode: 'MAX_ATTEMPTS', message: 'Max verification attempts exceeded' });
      }
      await otpRecord.save();
      return res.status(400).json({ errorCode: 'INVALID_OTP', message: 'Incorrect 2FA code' });
    }

    // OTP is valid! Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'No active user found with this email. Please contact your administrator.'
      });
    }

    // Delete the Otp record so it cannot be reused
    await otpRecord.destroy();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: user.toJSON(),
      mustResetPassword: user.mustResetPassword,
    });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ errorCode: 'NO_TOKEN', message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ errorCode: 'INVALID_TOKEN', message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (error) {
    res.status(401).json({ errorCode: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// PUT /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = req.user;

    if (!validatePasswordPolicy(newPassword)) {
      return res.status(400).json({
        errorCode: 'WEAK_PASSWORD',
        message: passwordPolicyMessage,
      });
    }

    user.password = newPassword;
    user.mustResetPassword = false;
    await user.save();

    res.json({ message: 'Password reset successfully', user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const genericMessage = 'If this email is registered, you will receive a reset code';

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.json({ message: genericMessage });
    }

    const code = generateSixDigitOtp();
    user.resetOtpHash = await bcrypt.hash(code, 12);
    user.resetOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    if (process.env.NODE_ENV !== 'test') {
      try {
        await sendPasswordResetCodeEmail(email, code);
      } catch (mailError) {
        console.error(`Failed to send password reset code to ${email}:`, mailError.message);
      }
    }

    res.json({ message: genericMessage });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/auth/verify-reset-code
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt || new Date() > user.resetOtpExpiresAt) {
      return res.status(400).json({ errorCode: 'INVALID_RESET_CODE', message: 'Invalid or expired code. Please try again.' });
    }

    const valid = await bcrypt.compare(code, user.resetOtpHash);
    if (!valid) {
      return res.status(400).json({ errorCode: 'INVALID_RESET_CODE', message: 'Invalid or expired code. Please try again.' });
    }

    res.json({ message: 'Reset code verified' });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// POST /api/auth/set-new-password
const setNewPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!validatePasswordPolicy(newPassword)) {
      return res.status(400).json({
        errorCode: 'WEAK_PASSWORD',
        message: passwordPolicyMessage,
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt || new Date() > user.resetOtpExpiresAt) {
      return res.status(400).json({ errorCode: 'INVALID_RESET_CODE', message: 'Invalid or expired code. Please try again.' });
    }

    const valid = await bcrypt.compare(code, user.resetOtpHash);
    if (!valid) {
      return res.status(400).json({ errorCode: 'INVALID_RESET_CODE', message: 'Invalid or expired code. Please try again.' });
    }

    user.password = newPassword;
    user.mustResetPassword = false;
    user.resetOtpHash = null;
    user.resetOtpExpiresAt = null;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, department } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) {
      if (phone) {
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Check if phone number is already taken by another user
        const existing = await User.findOne({ where: { phone: cleanPhone, id: { [Op.ne]: user.id } } });
        if (existing) {
          return res.status(400).json({
            errorCode: 'PHONE_TAKEN',
            message: 'Phone number is already associated with another account'
          });
        }
        user.phone = cleanPhone;
      } else {
        user.phone = null;
      }
    }
    if (bio !== undefined) user.bio = bio;
    if (department !== undefined) user.department = department;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ errorCode: 'INVALID_PASSWORD', message: 'Current password is incorrect' });
    }
    if (!validatePasswordPolicy(newPassword)) {
      return res.status(400).json({ errorCode: 'WEAK_PASSWORD', message: passwordPolicyMessage });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: error.message });
  }
};

module.exports = { 
  login, 
  refresh, 
  logout, 
  resetPassword, 
  getMe, 
  verify2fa, 
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetCode,
  setNewPassword
};
