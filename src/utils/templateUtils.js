export function renderTemplate(text, contact) {
  return String(text || '').replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    return contact?.[key] != null ? String(contact[key]) : '';
  });
}

export const sampleContact = {
  name: 'Jane Doe',
  email: 'jane@company.com',
  company: 'Mona Co',
};
