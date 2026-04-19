const BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let body = {};
    try {
      body = await response.json();
    } catch (error) {
      body = { error: response.statusText || 'Unexpected error' };
    }
    throw new Error(body.error || body.message || `Request failed with status ${response.status}`);
  }

  return response.json().catch(() => null);
}

export function signup(payload) {
  return request('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) });
}

export function login(payload) {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function getCurrentUser() {
  return request('/api/auth/me');
}

export function uploadContactFile(file) {
  const form = new FormData();
  form.append('file', file);

  return fetch(`${BASE_URL}/api/contacts/upload`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Unable to upload contact file');
    }
    return response.json();
  });
}

export function saveContacts(contacts) {
  return request('/api/contacts', { method: 'POST', body: JSON.stringify({ contacts }) });
}

export function getContacts() {
  return request('/api/contacts');
}

export function updateContact(id, payload) {
  return request(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteContact(id) {
  return request(`/api/contacts/${id}`, { method: 'DELETE' });
}

export function getTemplates() {
  return request('/api/templates');
}

export function createTemplate(payload) {
  return request('/api/templates', { method: 'POST', body: JSON.stringify(payload) });
}

export function deleteTemplate(id) {
  return request(`/api/templates/${id}`, { method: 'DELETE' });
}

export function duplicateTemplate(id) {
  return request(`/api/templates/${id}/duplicate`, { method: 'POST' });
}

export function getCampaigns() {
  return request('/api/campaigns');
}

export function createCampaign(payload) {
  return request('/api/campaigns', { method: 'POST', body: JSON.stringify(payload) });
}

export function getSettings() {
  return request('/api/settings');
}

export function saveSettings(payload) {
  return request('/api/settings', { method: 'POST', body: JSON.stringify(payload) });
}
