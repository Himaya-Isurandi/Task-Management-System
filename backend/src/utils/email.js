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
    subject: 'Welcome to Task Management System',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been created. Please log in with the credentials below:</p>
      <p><strong>Email:</strong> ${to}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p><strong>You must reset your password on first login.</strong></p>
      <p>Login at: ${process.env.FRONTEND_URL}/login</p>
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

module.exports = { sendWelcomeEmail, sendPasswordResetEmail, send2faEmail };
