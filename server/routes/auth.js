const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readCollection, saveCollection } = require('../dataStore');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  const users = readCollection('users');
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const nextUser = {
    id: uuidv4(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
  };

  users.push(nextUser);
  saveCollection('users', users);

  const templates = readCollection('templates');
  templates.push({
    id: uuidv4(),
    ownerId: nextUser.id,
    name: 'Welcome campaign',
    senderName: nextUser.name,
    senderEmail: nextUser.email,
    subject: 'Welcome to MoMail, {{name}}!',
    body: 'Hi {{name}},\n\nThanks for joining MoMail. We help you create personalized email campaigns fast.\n\nBest,\n{{senderName}}',
    createdAt: new Date().toISOString(),
  });
  saveCollection('templates', templates);

  req.session.userId = nextUser.id;

  return res.json({ id: nextUser.id, name: nextUser.name, email: nextUser.email });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = readCollection('users');
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid login credentials.' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid login credentials.' });
  }

  req.session.userId = user.id;
  return res.json({ id: user.id, name: user.name, email: user.email });
});

router.get('/me', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const users = readCollection('users');
  const user = users.find((item) => item.id === req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Session expired.' });
  }

  res.json({ id: user.id, name: user.name, email: user.email });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

module.exports = router;
