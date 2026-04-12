const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const formData = require('form-data');
const Mailgun = require('mailgun.js');

const provider = process.env.EMAIL_PROVIDER || 'console';
const fromAddress = process.env.EMAIL_FROM || 'no-reply@mona-email.app';

async function sendWithSmtp(message, config = {}) {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost || process.env.SMTP_HOST,
    port: Number(config.smtpPort || process.env.SMTP_PORT) || 587,
    secure: config.smtpSecure === true || process.env.SMTP_SECURE === 'true',
    auth: {
      user: config.smtpUser || process.env.SMTP_USER,
      pass: config.smtpPass || process.env.SMTP_PASS,
    },
  });

  return transporter.sendMail({
    from: message.from || fromAddress,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

async function sendWithSendGrid(message, config = {}) {
  sgMail.setApiKey(config.sendgridApiKey || process.env.SENDGRID_API_KEY || '');
  const result = await sgMail.send({
    from: message.from || fromAddress,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  if (Array.isArray(result) && result.length > 0) {
    console.log('[SendGrid] send result:', result.map((item) => ({ statusCode: item.statusCode, headers: item.headers })));
    const firstResponse = result[0];
    if (firstResponse.statusCode >= 400) {
      throw new Error(`SendGrid send failed with status ${firstResponse.statusCode}`);
    }
  } else {
    console.log('[SendGrid] send result:', result);
  }

  return result;
}

async function sendWithMailgun(message, config = {}) {
  const mailgun = new Mailgun(formData);
  const client = mailgun.client({
    username: 'api',
    key: config.mailgunApiKey || process.env.MAILGUN_API_KEY || '',
  });

  return client.messages.create(config.mailgunDomain || process.env.MAILGUN_DOMAIN || '', {
    from: message.from || fromAddress,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

async function sendEmail(message, config = {}) {
  if (!message.to || !message.subject || !message.text) {
    throw new Error('Email message is missing required fields.');
  }

  const activeProvider = config.provider || provider;

  if (activeProvider === 'smtp') {
    return sendWithSmtp(message, config.providerConfig || {});
  }

  if (activeProvider === 'sendgrid') {
    return sendWithSendGrid(message, config.providerConfig || {});
  }

  if (activeProvider === 'mailgun') {
    return sendWithMailgun(message, config.providerConfig || {});
  }

  console.log('Email provider not configured. Email would have been sent:', message);
  return { accepted: [message.to], message: 'Simulated send' };
}

module.exports = {
  sendEmail,
  provider,
};
