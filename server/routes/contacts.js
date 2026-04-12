const express = require('express');
const multer = require('multer');
const { readCollection, saveCollection } = require('../dataStore');
const { parse } = require('papaparse');
const xlsx = require('xlsx');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
}

function detectFields(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { name: '', email: '', company: '' };
  }

  const keys = Object.keys(rows[0]);
  const normalized = keys.reduce((acc, key) => {
    acc[key.toLowerCase().trim()] = key;
    return acc;
  }, {});

  return {
    name: normalized.name || normalized.fullname || normalized['first name'] || normalized.firstname || keys[0] || '',
    email: normalized.email || normalized.e_mail || normalized['email address'] || normalized['e-mail'] || '',
    company: normalized.company || normalized.organization || normalized.org || normalized['company name'] || '',
  };
}

router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File upload is required.' });
  }

  const fileName = req.file.originalname.toLowerCase();
  let rows = [];

  if (fileName.endsWith('.csv')) {
    const text = req.file.buffer.toString('utf8');
    const result = parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false, transformHeader: (header) => header.trim() });
    rows = result.data || [];
  } else {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  }

  res.json({ rows, mapping: detectFields(rows) });
});

router.get('/', requireAuth, (req, res) => {
  const contacts = readCollection('contacts');
  const userContacts = contacts.filter((contact) => contact.ownerId === req.session.userId);
  res.json(userContacts);
});

router.post('/', requireAuth, (req, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ error: 'Contacts must be an array.' });
  }

  const allContacts = readCollection('contacts');
  const nextContacts = [
    ...allContacts.filter((contact) => contact.ownerId !== req.session.userId),
    ...contacts.map((contact) => ({
      ...contact,
      id: `${req.session.userId}-${contact.email}-${Date.now()}`,
      ownerId: req.session.userId,
    })),
  ];

  saveCollection('contacts', nextContacts);
  res.json({ saved: contacts.length });
});

module.exports = router;
