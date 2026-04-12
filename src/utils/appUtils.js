const STORAGE_KEYS = {
  users: 'emailCampaign_users',
  currentUser: 'emailCampaign_currentUser',
  contacts: 'emailCampaign_contacts',
  templates: 'emailCampaign_templates',
  campaigns: 'emailCampaign_campaigns',
};

function loadStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadUsers() {
  return loadStorage(STORAGE_KEYS.users, []);
}

export function saveUsers(users) {
  saveStorage(STORAGE_KEYS.users, users);
}

export function getCurrentUser() {
  return loadStorage(STORAGE_KEYS.currentUser, null);
}

export function setCurrentUser(user) {
  saveStorage(STORAGE_KEYS.currentUser, user);
}

export function signOut() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
}

export function loadContacts() {
  return loadStorage(STORAGE_KEYS.contacts, []);
}

export function saveContacts(contacts) {
  saveStorage(STORAGE_KEYS.contacts, contacts);
}

export function loadTemplates() {
  return loadStorage(STORAGE_KEYS.templates, []);
}

export function saveTemplates(templates) {
  saveStorage(STORAGE_KEYS.templates, templates);
}

export function loadCampaigns() {
  return loadStorage(STORAGE_KEYS.campaigns, []);
}

export function saveCampaigns(campaigns) {
  saveStorage(STORAGE_KEYS.campaigns, campaigns);
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}
