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

  let finalStatus = campaignStatus;
  if (campaignStatus === 'sent') {

    const BATCH_SIZE = 5;
    const DELAY_BETWEEN_BATCHES = 1000;

    (async () => {
      for (let i = 0; i < selectedContacts.length; i += BATCH_SIZE) {
        const batch = selectedContacts.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (contact) => {
          const message = {
            to: contact.email,
            from: template.senderEmail || userSettings.fromEmail || process.env.EMAIL_FROM || 'no-reply@mona-email.app',
            subject: renderTemplate(template.subject, contact),
            text: renderTemplate(template.body, contact),
            html: renderTemplate(template.body, contact).replace(/\n/g, '<br />'),
          };

          try {
            await sendEmail(message, {
              provider: userSettings.provider,
              providerConfig: userSettings.providerConfig,
            });
            const campaignIdx = readCollection('campaigns').findIndex(c => c.id === campaign.id);
            if (campaignIdx !== -1) {
              const campaigns = readCollection('campaigns');
              const recipientIdx = campaigns[campaignIdx].recipients.findIndex(r => r.email === contact.email);
              if (recipientIdx !== -1) {
                campaigns[campaignIdx].recipients[recipientIdx].status = userSettings.provider === 'console' || !userSettings.provider ? 'simulated' : 'sent';
                if (campaigns[campaignIdx].recipients[recipientIdx].status === 'sent') {
                  campaigns[campaignIdx].deliveredCount += 1;
                }
                saveCollection('campaigns', campaigns);
              }
            }
          } catch (error) {
            console.error(`[Queue Error] ${contact.email}: ${error.message}`);
          }
        }));
        
        if (i + BATCH_SIZE < selectedContacts.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }
    })();
  }

  const campaign = {
    id: uuidv4(),
    ownerId: req.session.userId,
    name: template.name,
    templateId: template.id,
    status: isScheduled ? 'scheduled' : 'sending',
    createdAt: now.toISOString(),
    scheduledAt: scheduledDate.toISOString(),
    recipientCount: selectedContacts.length,
    deliveredCount: 0,
    recipients: selectedContacts.map(c => ({
      id: uuidv4(),
      email: c.email,
      name: c.name,
      company: c.company,
      status: isScheduled ? 'pending' : 'queued',
      subject: renderTemplate(template.subject, c)
    })),
  };

  const campaigns = readCollection('campaigns');
  campaigns.push(campaign);
  saveCollection('campaigns', campaigns);

  res.json(campaign);
});

module.exports = router;
