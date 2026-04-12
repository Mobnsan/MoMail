import { useEffect, useMemo, useState, useRef } from 'react';
import gsap from 'gsap';
import NavBar from '../components/NavBar';
import { detectFields, dedupeContacts, getMappedValue, validateEmail } from '../utils/validation';
import { getContacts, saveContacts, uploadContactFile } from '../api';
import { usePageAnimation } from '../hooks/useAnimations';

function Contacts() {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [fieldMap, setFieldMap] = useState({ name: '', email: '', company: '' });
  const [customFields, setCustomFields] = useState([]);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState([]);
  const pageRef = usePageAnimation();
  const tableRef = useRef(null);

  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  useEffect(() => {
    getContacts().then(setSaved).catch(() => setSaved([]));
  }, []);

  useEffect(() => {
    if (tableRef.current) {
      gsap.from(tableRef.current, {
        duration: 0.5,
           
        ease: 'power2.out'
      });
    }
  }, [saved]);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name);
    try {
      const result = await uploadContactFile(file);
      setRows(result.rows || []);
      setFieldMap(result.mapping || detectFields(result.rows));
      setMessage('File uploaded successfully. Map the columns and save contacts.');
    } catch (error) {
      setMessage(error.message || 'Error reading file. Please choose a valid CSV or XLSX file.');
      setRows([]);
    }
  }

  function updateFieldMap(key, value) {
    setFieldMap((prev) => ({ ...prev, [key]: value }));
  }

  function addCustomField() {
    setCustomFields((prev) => [...prev, { id: Date.now(), key: '', source: '' }]);
  }

  function removeCustomField(id) {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  }

  function updateCustomField(id, data) {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
  }

  const previewContacts = useMemo(() => {
    const fullMap = { ...fieldMap };
    customFields.forEach((f) => {
      if (f.key && f.source) fullMap[f.key] = f.source;
    });

    return rows.slice(0, 8).map((row, index) => ({
      id: index,
      _mapped: Object.keys(fullMap).reduce((acc, k) => {
        acc[k] = row[fullMap[k]] ?? '';
        return acc;
      }, {}),
      name: getMappedValue(row, 'name', fieldMap),
      email: getMappedValue(row, 'email', fieldMap),
      company: getMappedValue(row, 'company', fieldMap),
      isValid: validateEmail(getMappedValue(row, 'email', fieldMap)),
    }));
  }, [rows, fieldMap, customFields]);

  async function handleSave() {
    const fullMap = { ...fieldMap };
    customFields.forEach((f) => {
      if (f.key && f.source) fullMap[f.key] = f.source;
    });

    const mapped = rows.map((row) => {
      const contact = {
        name: getMappedValue(row, 'name', fieldMap),
        email: getMappedValue(row, 'email', fieldMap),
        company: getMappedValue(row, 'company', fieldMap),
      };
      
      // Add custom fields
      customFields.forEach((f) => {
        if (f.key && f.source) {
          contact[f.key] = row[f.source] ?? '';
        }
      });
      
      return contact;
    });

    const validContacts = dedupeContacts(mapped).filter((contact) => validateEmail(contact.email));
    
    if (validContacts.length === 0 && rows.length > 0) {
      setMessage('0 contacts saved. Please ensure you have mapped the EMAIL field to the correct column in your file.');
      return;
    }

    try {
      await saveContacts(validContacts);
      setSaved(validContacts);
      setMessage(`${validContacts.length} contacts saved after validation and duplicate removal.`);
    } catch (error) {
      setMessage(error.message || 'Unable to save contacts.');
    }
  }

  const rowCount = rows.length;
  const validPreviewCount = previewContacts.filter((contact) => validateEmail(contact.email)).length;

  return (
    <div className="App">
      <NavBar />
      <div className="page" ref={pageRef}>
        <div className="page-head">
          <div>
            <h1>Contact Import</h1>
            <p>Upload a contact file, map columns, and store validated email recipients.</p>
          </div>
        </div>

        {message && <div className="alert">{message}</div>}

        <div className="card">
          <div className="form-group">
            <label htmlFor="contact-file">Choose file</label>
            <input id="contact-file" type="file" accept=".csv,.xlsx" onChange={handleFileChange} />
            {fileName && <div className="footer-note">Loaded: {fileName}</div>}
          </div>

          {columns.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <h3>Field mapping</h3>
              {['name', 'email', 'company'].map((field) => (
                <div className="form-group" key={field}>
                  <label>{field.toUpperCase()} {field === 'email' && <span className="footer-note">*required</span>}</label>
                  <select value={fieldMap[field]} onChange={(e) => updateFieldMap(field, e.target.value)}>
                    <option value="">Select source column</option>
                    {columns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                <h3>Custom fields</h3>
                <p className="footer-note">Map additional columns (e.g., Age, City) to use them in templates.</p>
                
                {customFields.map((field) => (
                  <div className="form-group-inline" key={field.id} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="text" 
                        placeholder="Variable name (e.g. age)" 
                        value={field.key} 
                        onChange={(e) => updateCustomField(field.id, { key: e.target.value })} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <select value={field.source} onChange={(e) => updateCustomField(field.id, { source: e.target.value })}>
                        <option value="">Select source column</option>
                        {columns.map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className="button-icon" onClick={() => removeCustomField(field.id)}>✕</button>
                  </div>
                ))}
                
                <button className="button-secondary" type="button" onClick={addCustomField}>
                  + Add custom field
                </button>
              </div>

              <div style={{ marginTop: 24 }}>
                <button className="button" type="button" onClick={handleSave}>
                  Save contacts
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card-grid" style={{ marginTop: 24 }}>
          <div className="card">
            <strong>{rowCount}</strong>
            <div>Imported rows</div>
          </div>
          <div className="card">
            <strong>{validPreviewCount}</strong>
            <div>Valid preview emails</div>
          </div>
          <div className="card">
            <strong>{saved.length}</strong>
            <div>Total saved contacts</div>
          </div>
        </div>

        <section className="section-panel">
          <h2>Saved contacts</h2>
          {saved.length === 0 ? (
            <div className="alert">No saved contacts yet. Import and save a file to see your contact list.</div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                  </tr>
                </thead>
                <tbody>
                  {saved.map((contact) => (
                    <tr key={contact.id || `${contact.email}-${contact.name}`}>
                      <td>{contact.name}</td>
                      <td>{contact.email}</td>
                      <td>{contact.company}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {previewContacts.length > 0 && (
          <section className="section-panel">
            <h2>Preview contacts</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    {customFields.map(f => f.key && <th key={f.id}>{f.key}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {previewContacts.map((contact) => (
                    <tr key={contact.id} className={!contact.isValid ? 'row-invalid' : ''}>
                      <td>
                        {contact.isValid ? 
                          <span style={{ color: '#4ade80' }}>✓</span> : 
                          <span style={{ color: '#f87171' }} title="Invalid Email">⚠</span>
                        }
                      </td>
                      <td>{contact.name}</td>
                      <td>{contact.email}</td>
                      <td>{contact.company}</td>
                      {customFields.map(f => f.key && <td key={f.id}>{contact._mapped[f.key]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Contacts;
