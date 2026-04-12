const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');

function loadDatabase() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], contacts: [], templates: [], campaigns: [], settings: [] }, null, 2));
  }

  const raw = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(raw || '{}');
}

function writeDatabase(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function readCollection(name) {
  const db = loadDatabase();
  return db[name] || [];
}

function saveCollection(name, items) {
  const db = loadDatabase();
  db[name] = items;
  writeDatabase(db);
}

function createItem(name, item) {
  const items = readCollection(name);
  items.push(item);
  saveCollection(name, items);
}

module.exports = {
  loadDatabase,
  writeDatabase,
  readCollection,
  saveCollection,
  createItem,
};
