import isEmail from 'email-validator';

export function validateEmail(email) {
  return isEmail.validate(String(email || '').trim());
}

export function dedupeContacts(contacts) {
  const seen = new Set();
  return contacts.filter((contact) => {
    const normalizedEmail = String(contact.email || '').trim().toLowerCase();
    if (!normalizedEmail || seen.has(normalizedEmail)) {
      return false;
    }
    seen.add(normalizedEmail);
    return true;
  });
}

export function detectFields(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { name: '', email: '', company: '' };
  }

  const keys = Object.keys(rows[0]);
  const normalized = keys.reduce((acc, key) => {
    acc[key.toLowerCase().trim()] = key;
    return acc;
  }, {});

  return {
    name:
      normalized.name ||
      normalized.fullname ||
      normalized['first name'] ||
      normalized.firstname ||
      keys[0] ||
      '',
    email:
      normalized.email ||
      normalized.e_mail ||
      normalized['email address'] ||
      normalized['e-mail'] ||
      '',
    company:
      normalized.company ||
      normalized.organization ||
      normalized.org ||
      normalized['company name'] ||
      '',
  };
}

export function getMappedValue(row, fieldKey, map) {
  return row[map[fieldKey]] ?? '';
}

export function mapRow(row, map) {
  return Object.keys(map).reduce((acc, targetKey) => {
    const sourceKey = map[targetKey];
    if (sourceKey) {
      acc[targetKey] = row[sourceKey] ?? '';
    }
    return acc;
  }, {});
}
