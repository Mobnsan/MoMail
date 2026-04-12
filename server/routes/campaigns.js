const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readCollection, saveCollection } = require('../dataStore');
const { sendEmail } = require('../emailProvider');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
}

function renderTemplate(text, contact) {
  return String(text || '').replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    return contact?.[key] ?? '';
  });
}

router.get('/', requireAuth, (req, res) => {
  const campaigns = readCollection('campaigns');
  const userCampaigns = campaigns.filter((item) => item.ownerId === req.session.userId);
  res.json(userCampaigns);
});

router.post('/', requireAuth, async (req, res) => {
  const { templateId, scheduledAt, contactIds } = req.body;
  const templates = readCollection('templates');
  const template = templates.find((item) => item.id === templateId && item.ownerId === req.session.userId);
  if (!template) {
    return res.status(404).json({ error: 'Template not found.' });
  }

  const allContacts = readCollection('contacts').filter((item) => item.ownerId === req.session.userId);
  const userSettings = readCollection('settings').find((item) => item.ownerId === req.session.userId) || {};
  const selectedContacts = Array.isArray(contactIds) && contactIds.length > 0
    ? allContacts.filter((item) => contactIds.includes(item.id))
    : allContacts;

  if (!selectedContacts.length) {
    return res.status(400).json({ error: 'No contacts selected for the campaign.' });
  }

  const now = new Date();
  const scheduledDate = scheduledAt ? new Date(scheduledAt) : now;
  const isScheduled = scheduledAt && scheduledDate > now;
  const campaignStatus = isScheduled
    ? 'scheduled'
    : (userSettings.provider === 'console' || !userSettings.provider ? 'simulated' : 'sent');

  const recipients = [];
  let deliveredCount = 0;
  const shouldSendNow = !isScheduled && campaignStatus === 'sent';

  for (const contact of selectedContacts) {
    const message = {
      to: contact.email,
      from: template.senderEmail || userSettings.fromEmail || process.env.EMAIL_FROM || 'no-reply@mona-email.app',
      subject: renderTemplate(template.subject, contact),
      text: renderTemplate(template.body, contact),
      html: renderTemplate(template.body, contact).replace(/\n/g, '<br />'),
    };

    let status = shouldSendNow ? 'failed' : 'pending';
    let errorMessage = '';
    if (shouldSendNow) {
      try {
        await sendEmail(message, {
          provider: userSettings.provider,
          providerConfig: userSettings.providerConfig,
        });
        status = userSettings.provider === 'console' || !userSettings.provider ? 'simulated' : 'sent';
        if (status === 'sent') {
          deliveredCount += 1;
        }
      } catch (error) {
        status = 'failed';
        errorMessage = error.message || String(error);
        console.error(`[Campaign Send Error] User: ${req.session.userId}, Email: ${contact.email}, Error: ${errorMessage}`);
      }
    }

    const recipientObj = {
      id: uuidv4(),
      email: contact.email,
      name: contact.name,
      company: contact.company,
      status,
      subject: message.subject,
    };
    
    if (errorMessage) {
      recipientObj.error = errorMessage;
    }
    
    recipients.push(recipientObj);
  }

  let finalStatus = campaignStatus;
  if (campaignStatus === 'sent') {
    if (deliveredCount === 0) {
      finalStatus = 'failed';
    } else if (deliveredCount < recipients.length) {
      finalStatus = 'partial';
    }
  }

  const campaign = {
    id: uuidv4(),
    ownerId: req.session.userId,
    name: template.name,
    templateId: template.id,
    status: finalStatus,
    createdAt: now.toISOString(),
    scheduledAt: scheduledDate.toISOString(),
    recipientCount: recipients.length,
    deliveredCount,
    recipients,
  };

  const campaigns = readCollection('campaigns');
  campaigns.push(campaign);
  saveCollection('campaigns', campaigns);

  res.json(campaign);
});

module.exports = router;
