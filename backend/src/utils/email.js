const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWelcomeEmail = async (to, name, tempPassword) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Your account has been created',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been created. Please log in with the credentials below and change your password immediately.</p>
      <p><strong>Email:</strong> ${to}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p>This temporary password is a 6-digit code. You must set a new password before accessing the system.</p>
      <p>Login at: ${process.env.FRONTEND_URL}/login</p>
    `,
  });
};

const sendPasswordResetCodeEmail = async (to, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Password reset code',
    html: `
      <h2>Password Reset Code</h2>
      <p>Use the following 6-digit code to reset your Task Management System password. This code expires in 15 minutes.</p>
      <h1 style="font-size: 2.5rem; letter-spacing: 5px; font-family: monospace; font-weight: bold; margin: 20px 0; color: #4F46E5;">${code}</h1>
    `,
  });
};

const sendPasswordResetEmail = async (to, name) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Your TMS Password Was Reset',
    html: `<h2>Hi ${name},</h2><p>Your password has been successfully updated.</p>`,
  });
};

const send2faEmail = async (to, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Your TMS Verification Code',
    html: `
      <h2>Two-Factor Authentication Code</h2>
      <p>Please use the following 6-digit code to log in to the Task Management System. This code will expire in 5 minutes.</p>
      <h1 style="font-size: 2.5rem; letter-spacing: 5px; font-family: monospace; font-weight: bold; margin: 20px 0; color: #4F46E5;">${code}</h1>
    `,
  });
};

module.exports = { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetCodeEmail, send2faEmail };
