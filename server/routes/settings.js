const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readCollection, saveCollection } = require('../dataStore');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
}

router.get('/', requireAuth, (req, res) => {
  const settings = readCollection('settings');
  const userSettings = settings.find((item) => item.ownerId === req.session.userId);
  res.json(userSettings || { provider: 'console', providerConfig: {}, fromEmail: '' });
});

router.get('/providers', requireAuth, (req, res) => {
  const providers = [];

  if (process.env.SENDGRID_API_KEY) {
    providers.push({ provider: 'sendgrid', label: 'SendGrid', configured: true });
  }

  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    providers.push({ provider: 'mailgun', label: 'Mailgun', configured: true });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    providers.push({ provider: 'smtp', label: 'SMTP', configured: true });
  }

  res.json(providers);
});

router.post('/', requireAuth, (req, res) => {
  const { provider, providerConfig = {}, fromEmail } = req.body;
  const settings = readCollection('settings').filter((item) => item.ownerId !== req.session.userId);
  const newSettings = {
    id: uuidv4(),
    ownerId: req.session.userId,
    provider: provider || 'console',
    providerConfig,
    fromEmail: fromEmail || '',
  };

  settings.push(newSettings);
  saveCollection('settings', settings);
  res.json(newSettings);
});

router.post('/auto-connect', requireAuth, (req, res) => {
  const { provider } = req.body;
  const users = readCollection('users');
  const currentUser = users.find((user) => user.id === req.session.userId);
  const baseEmail = currentUser?.email || process.env.EMAIL_FROM || '';

  let providerConfig = {};
  if (provider === 'sendgrid') {
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(400).json({ error: 'SendGrid is not configured on the server.' });
    }
    providerConfig = { sendgridApiKey: process.env.SENDGRID_API_KEY };
  } else if (provider === 'mailgun') {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      return res.status(400).json({ error: 'Mailgun is not configured on the server.' });
    }
    providerConfig = {
      mailgunApiKey: process.env.MAILGUN_API_KEY,
      mailgunDomain: process.env.MAILGUN_DOMAIN,
    };
  } else if (provider === 'smtp') {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(400).json({ error: 'SMTP is not configured on the server.' });
    }
    providerConfig = {
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT || '587',
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
      smtpSecure: process.env.SMTP_SECURE === 'true',
    };
  } else {
    return res.status(400).json({ error: 'Unknown provider.' });
  }

  const settings = readCollection('settings').filter((item) => item.ownerId !== req.session.userId);
  const newSettings = {
    id: uuidv4(),
    ownerId: req.session.userId,
    provider,
    providerConfig,
    fromEmail: baseEmail,
  };
  settings.push(newSettings);
  saveCollection('settings', settings);

  res.json(newSettings);
});

module.exports = router;
