const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
const smtpPort = process.env.SMTP_PORT || process.env.EMAIL_PORT;
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM;
const appName = process.env.APP_NAME || 'TaskNova';
const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: Number(smtpPort || 587),
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const sendWelcomeEmail = async (to, name, tempPassword) => {
  const loginUrl = `${frontendUrl.replace(/\/$/, '')}/login`;
  const safeAppName = escapeHtml(appName);
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(to);
  const safePassword = escapeHtml(tempPassword);

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: `Welcome to ${safeAppName}`,
    html: `
      <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033;">
        <div style="max-width:560px;margin:0 auto;padding:32px 18px;">
          <div style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dbe5f2;">
            <div style="background:#0d1f3c;color:#ffffff;padding:24px 28px;">
              <h1 style="margin:0;font-size:24px;letter-spacing:0.2px;">${safeAppName}</h1>
            </div>
            <div style="padding:28px;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#172033;">Welcome, ${safeName}!</h2>
              <p style="margin:0 0 18px;line-height:1.55;color:#475569;">
                Your ${safeAppName} account has been created. Use the temporary password below to sign in.
              </p>
              <div style="background:#eef6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px;margin:20px 0;">
                <p style="margin:0 0 10px;font-size:14px;color:#334155;"><strong>Login email:</strong> ${safeEmail}</p>
                <p style="margin:0;font-size:14px;color:#334155;"><strong>Temporary password:</strong> <span style="font-family:Consolas,monospace;font-size:16px;color:#0d1f3c;">${safePassword}</span></p>
              </div>
              <p style="margin:0 0 20px;line-height:1.55;color:#475569;">
                You will be required to change your password on first login.
              </p>
              <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:bold;">Log in to ${safeAppName}</a>
              <p style="margin:24px 0 0;font-size:13px;color:#64748b;">
                Security note: Do not share this email.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

const sendPasswordResetCodeEmail = async (to, code) => {
  await transporter.sendMail({
    from: smtpFrom,
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
    from: smtpFrom,
    to,
    subject: 'Your TMS Password Was Reset',
    html: `<h2>Hi ${name},</h2><p>Your password has been successfully updated.</p>`,
  });
};

const send2faEmail = async (to, code) => {
  await transporter.sendMail({
    from: smtpFrom,
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
