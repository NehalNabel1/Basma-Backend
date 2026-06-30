import nodemailer from 'nodemailer';
import logger from './logger.js';

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
  }
  return transporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent: ${info.messageId} -> ${to}`);
    return info;
  } catch (err) {
    logger.error(`Email failed to ${to}:`, err.message);
    throw err;
  }
};

// ─── Base Template ────────────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #2d8f8f, #1a5f5f); padding: 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 26px; letter-spacing: 2px; }
    .header p  { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
    .body { padding: 40px 32px; color: #333; line-height: 1.8; }
    .otp-box { background: #f0fafa; border: 2px solid #2d8f8f; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 44px; font-weight: bold; color: #2d8f8f; letter-spacing: 10px; font-family: monospace; }
    .otp-expiry { margin: 8px 0 0; color: #777; font-size: 13px; }
    .btn { display: inline-block; background: #2d8f8f; color: #ffffff !important; padding: 15px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; margin: 20px 0; }
    .btn:hover { background: #1a5f5f; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .note { background: #fffbea; border-right: 4px solid #f5c518; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #555; }
    .footer { background: #f5f7fa; padding: 20px 32px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>بصمة | Basma</h1>
      <p>منصة إدارة الموارد البشرية</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه.</p>
      <p>© ${new Date().getFullYear()} Basma HR Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

// ─── OTP Email (manager signup + login 2FA) ───────────────────────────────────
export const sendOTPEmail = async ({ to, name, otp, purpose }) => {
  const purposeText = {
    signup: 'تأكيد إنشاء الحساب',
    login:  'تسجيل الدخول',
  }[purpose] || 'التحقق';

  const html = baseTemplate(`
    <p>مرحباً <strong>${name}</strong>،</p>
    <p>رمز التحقق الخاص بـ <strong>${purposeText}</strong>:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <p class="otp-expiry">⏱ صالح لمدة ${process.env.OTP_EXPIRES_MINUTES || 10} دقائق فقط</p>
    </div>
    <div class="note">إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد أو التواصل مع الدعم الفني.</div>
  `);

  await sendMail({ to, subject: `[بصمة] رمز التحقق: ${otp}`, html });
};

// ─── HR Invite Email ──────────────────────────────────────────────────────────
export const sendHRInviteEmail = async ({ to, name, inviteUrl, companyName, inviterName }) => {
  const html = baseTemplate(`
    <p>مرحباً <strong>${name}</strong>،</p>
    <p>
      تمت دعوتك كـ <strong>مسؤول موارد بشرية</strong> في نظام <strong>${companyName}</strong> على منصة بصمة.
      قام <strong>${inviterName}</strong> بإضافتك إلى النظام.
    </p>
    <p style="text-align:center;">
      <a class="btn" href="${inviteUrl}">قبول الدعوة</a>
    </p>
    <hr class="divider">
    <div class="note">
      هذا الرابط صالح لمدة <strong>7 أيام</strong>.
      إذا لم تكن تتوقع هذه الدعوة، يرجى التواصل مع مسؤول النظام لإعادة إرسال الدعوة.
    </div>
  `);

  await sendMail({ to, subject: `دعوة للانضمام إلى ${companyName} على منصة بصمة`, html });
};

// ─── Employee Invite Email ────────────────────────────────────────────────────
export const sendEmployeeInviteEmail = async ({ to, name, inviteUrl, companyName, inviterName }) => {
  const html = baseTemplate(`
    <p>مرحباً <strong>${name}</strong>،</p>
    <p>
      تمت إضافتك كـ <strong>موظف</strong> في شركة <strong>${companyName}</strong> على منصة بصمة.
      قام <strong>${inviterName}</strong> بإنشاء حسابك.
    </p>
    <p style="text-align:center;">
      <a class="btn" href="${inviteUrl}">تفعيل حسابي</a>
    </p>
    <hr class="divider">
    <div class="note">
      هذا الرابط صالح لمدة <strong>7 أيام</strong>.
      إذا كنت تعتقد أن هذا البريد وصلك بالخطأ، يرجى تجاهله.
    </div>
  `);

  await sendMail({ to, subject: `مرحباً بك في ${companyName} — تفعيل حسابك على بصمة`, html });
};
