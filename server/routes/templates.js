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
  const templates = readCollection('templates');
  res.json(templates.filter((item) => item.ownerId === req.session.userId));
});

router.post('/', requireAuth, (req, res) => {
  const { name, senderName, senderEmail, subject, body } = req.body;
  if (!name || !subject || !body) {
    return res.status(400).json({ error: 'Template name, subject, and body are required.' });
  }

  const templates = readCollection('templates');
  const nextTemplate = {
    id: uuidv4(),
    ownerId: req.session.userId,
    name,
    senderName: senderName || '',
    senderEmail: senderEmail || '',
    subject,
    body,
    createdAt: new Date().toISOString(),
  };

  templates.push(nextTemplate);
  saveCollection('templates', templates);
  res.json(nextTemplate);
});

router.post('/:id/duplicate', requireAuth, (req, res) => {
  const templates = readCollection('templates');
  const original = templates.find((item) => item.id === req.params.id && item.ownerId === req.session.userId);
  if (!original) {
    return res.status(404).json({ error: 'Template not found.' });
  }

  const duplicate = {
    ...original,
    id: uuidv4(),
    name: `${original.name} (copy)`,
    createdAt: new Date().toISOString(),
  };

  templates.push(duplicate);
  saveCollection('templates', templates);
  res.json(duplicate);
});

router.delete('/:id', requireAuth, (req, res) => {
  const templates = readCollection('templates');
  const nextTemplates = templates.filter((item) => !(item.id === req.params.id && item.ownerId === req.session.userId));
  saveCollection('templates', nextTemplates);
  res.json({ deleted: true });
});

module.exports = router;
