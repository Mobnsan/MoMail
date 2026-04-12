import { useEffect, useMemo, useState, useRef } from 'react';
import gsap from 'gsap';
import NavBar from '../components/NavBar';
import { createTemplate, deleteTemplate, duplicateTemplate, getTemplates, getContacts } from '../api';
import { renderTemplate, sampleContact } from '../utils/templateUtils';
import { usePageAnimation } from '../hooks/useAnimations';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState({
    name: '',
    senderName: '',
    senderEmail: '',
    subject: '',
    body: '',
  });
  const [message, setMessage] = useState('');
  const pageRef = usePageAnimation();
  const templatesRef = useRef([]);
  const [customVariables, setCustomVariables] = useState([]);
  const [newVarName, setNewVarName] = useState('');
  const [detectedVariables, setDetectedVariables] = useState([]);
  const bodyRef = useRef(null);

  useEffect(() => {
    getTemplates().then(setTemplates).catch(() => setTemplates([]));
    
    getContacts().then(loaded => {
      const keys = new Set();
      loaded.forEach(contact => {
        Object.keys(contact).forEach(k => {
          if (!['id', 'ownerId', 'name', 'email', 'company'].includes(k)) {
            keys.add(k);
          }
        });
      });
      setDetectedVariables(Array.from(keys));
    }).catch(() => setDetectedVariables([]));
  }, []);

  useEffect(() => {
    if (templatesRef.current.length > 0) {
      gsap.from(templatesRef.current, {
        duration: 0.6,
              
        x: -20,
        stagger: 0.08,
        ease: 'power2.out'
      });
    }
  }, [templates]);

  async function handleSave(event) {
    event.preventDefault();
    if (!template.name || !template.subject || !template.body) {
      setMessage('Please enter a template name, subject, and message body.');
      return;
    }

    try {
      const saved = await createTemplate(template);
      setTemplates((current) => [saved, ...current]);
      setTemplate({ name: '', senderName: '', senderEmail: '', subject: '', body: '' });
      setMessage('Template saved successfully.');
    } catch (error) {
      setMessage(error.message || 'Unable to save template.');
    }
  }

  async function handleDuplicate(item) {
    try {
      const duplicate = await duplicateTemplate(item.id);
      setTemplates((current) => [duplicate, ...current]);
      setMessage('Template duplicated.');
    } catch (error) {
      setMessage(error.message || 'Unable to duplicate template.');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTemplate(id);
      setTemplates((current) => current.filter((item) => item.id !== id));
      setMessage('Template deleted.');
    } catch (error) {
      setMessage(error.message || 'Unable to delete template.');
    }
  }

  const addCustomVariable = () => {
    if (newVarName.trim()) {
      if (!customVariables.includes(newVarName)) {
        setCustomVariables([...customVariables, newVarName]);
        setNewVarName('');
      } else {
        setMessage('This variable already exists.');
      }
    }
  };

  const removeCustomVariable = (varName) => {
    setCustomVariables(customVariables.filter(v => v !== varName));
  };

  function insertVariable(varName) {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = template.body;
    const tag = `{{${varName}}}`;
    
    const newText = text.substring(0, start) + tag + text.substring(end);
    setTemplate({ ...template, body: newText });

    // Move cursor after the inserted tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  const allVariables = useMemo(() => {
    const base = ['name', 'email', 'company'];
    const combined = [...base, ...detectedVariables, ...customVariables];
    return Array.from(new Set(combined));
  }, [detectedVariables, customVariables]);
  const preview = useMemo(() => renderTemplate(template.body, sampleContact), [template.body]);

  return (
    <div className="App">
      <NavBar />
      <div className="page" ref={pageRef}>
        <div className="page-head">
          <div>
            <h1>Template Builder</h1>
            <p>Save reusable email templates with personalization variables.</p>
          </div>
        </div>

        {message && <div className="alert">{message}</div>}

        <div className="card">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="template-name">Template name</label>
              <input
                id="template-name"
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sender-name">Sender name</label>
              <input
                id="sender-name"
                type="text"
                value={template.senderName}
                onChange={(e) => setTemplate({ ...template, senderName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sender-email">Sender email</label>
              <input
                id="sender-email"
                type="email"
                value={template.senderEmail}
                onChange={(e) => setTemplate({ ...template, senderEmail: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                type="text"
                value={template.subject}
                onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="body">Message body</label>
              <textarea
                id="body"
                ref={bodyRef}
                value={template.body}
                onChange={(e) => setTemplate({ ...template, body: e.target.value })}
              />
            </div>
            <div className="footer-note" style={{ marginTop: 12, marginBottom: 20 }}>
              <strong>Use variables (click to insert):</strong> 
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {allVariables.map((v) => (
                  <button 
                    key={v} 
                    type="button"
                    className="label-pill" 
                    onClick={() => insertVariable(v)}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e4e8f3', paddingTop: 16, marginTop: 16 }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Add custom variable</h4>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="e.g., department"
                  onKeyDown={(e) => e.key === 'Enter' && addCustomVariable()}
                  style={{ flex: 1, minHeight: 40, border: '1px solid #d9e2ed', borderRadius: 8, padding: '9px 12px' }}
                />
                <button 
                  type="button" 
                  className="button" 
                  onClick={addCustomVariable}
                  style={{ padding: '10px 16px', minWidth: 'auto' }}
                >
                  Add
                </button>
              </div>
              {customVariables.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <strong style={{ fontSize: '0.9rem' }}>Custom variables:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {customVariables.map((v) => (
                      <div 
                        key={v} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 6,
                          padding: '6px 10px',
                          background: '#f0f2ff',
                          borderRadius: 12,
                          fontSize: '0.9rem'
                        }}
                      >
                        {`{{${v}}}`}
                        <button
                          type="button"
                          onClick={() => removeCustomVariable(v)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ff6b6b',
                            padding: 0,
                            fontSize: '1.1rem',
                            lineHeight: 1
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="button" type="submit">
              Save template
            </button>
          </form>
        </div>

        {template.body && (
          <div className="card" style={{ marginTop: 22 }}>
            <h3>Preview</h3>
            <div>
              <strong>{template.subject || 'Subject preview'}</strong>
            </div>
            <p>{preview}</p>
          </div>
        )}

        <section className="section-panel">
          <h2>Saved templates</h2>
          {templates.length === 0 ? (
            <div className="alert">No templates saved yet. Save one to use it in campaigns.</div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Subject</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.subject}</td>
                      <td>
                        <button className="small-button" onClick={() => handleDuplicate(item)} type="button">
                          Duplicate
                        </button>{' '}
                        <button className="small-button" onClick={() => handleDelete(item.id)} type="button">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Templates;
