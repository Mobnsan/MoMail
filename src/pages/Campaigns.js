import { useEffect, useMemo, useState, useRef } from 'react';
import gsap from 'gsap';
import NavBar from '../components/NavBar';
import { createCampaign, getCampaigns, getContacts, getTemplates } from '../api';
import { renderTemplate, sampleContact } from '../utils/templateUtils';
import { usePageAnimation } from '../hooks/useAnimations';

function Campaigns() {
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [viewDetails, setViewDetails] = useState(null);
  usePageAnimation();
  const campaignsRef = useRef([]);

  useEffect(() => {
    getTemplates().then(setTemplates).catch(() => setTemplates([]));
    getContacts().then((loaded) => {
      setContacts(loaded);
      setSelectedContactIds(loaded.map((item) => item.id));
    }).catch(() => {
      setContacts([]);
      setSelectedContactIds([]);
    });
    getCampaigns().then(setCampaigns).catch(() => setCampaigns([]));
  }, []);

  useEffect(() => {
    if (campaignsRef.current.length > 0) {
      gsap.from(campaignsRef.current, {
        duration: 0.6,
          
        y: 20,
        stagger: 0.1,
        ease: 'power2.out'
      });
    }
  }, [campaigns]);

  const selectedTemplateObject = useMemo(
    () => templates.find((template) => template.id === selectedTemplate),
    [selectedTemplate, templates]
  );

  const previewContact = useMemo(() => {
    if (selectedContactIds.length > 0) {
      return contacts.find((contact) => contact.id === selectedContactIds[0]) || sampleContact;
    }
    return sampleContact;
  }, [selectedContactIds, contacts]);

  function handleContactToggle(contactId) {
    setSelectedContactIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId]
    );
  }

  function handleSelectAll(checked) {
    setSelectedContactIds(checked ? contacts.map((contact) => contact.id) : []);
  }

  async function handleCreateCampaign(event) {
    event.preventDefault();
    setStatusMessage('');

    if (!selectedTemplateObject) {
      setStatusMessage('Please choose a saved template before sending.');
      return;
    }

    if (contacts.length === 0) {
      setStatusMessage('Import contacts before creating a campaign.');
      return;
    }

    if (selectedContactIds.length === 0) {
      setStatusMessage('Select at least one contact for this campaign.');
      return;
    }

    try {
      const campaign = await createCampaign({ templateId: selectedTemplateObject.id, scheduledAt, contactIds: selectedContactIds });
      setCampaigns((current) => [campaign, ...current]);
      setStatusMessage(
        campaign.status === 'simulated'
          ? `Campaign saved as simulated send because no email provider is configured. Recipient count: ${campaign.recipientCount}.`
          : campaign.status === 'sent'
            ? `Campaign sent successfully to ${campaign.deliveredCount}/${campaign.recipientCount} contacts.`
            : campaign.status === 'partial'
              ? `Campaign partially sent: ${campaign.deliveredCount}/${campaign.recipientCount} delivered.`
              : `Campaign ${campaign.status} to ${campaign.recipientCount} contacts.`
      );
    } catch (error) {
      setStatusMessage(error.message || 'Unable to create campaign.');
    }
  }

  return (
    <div className="App">
      <NavBar />
      <div className="page">
        <div className="page-head">
          <div>
            <h1>Campaigns</h1>
            <p>Send, schedule, and review email campaigns with backend delivery support.</p>
          </div>
        </div>

        {statusMessage && <div className="alert">{statusMessage}</div>}

        <div className="card">
          <form onSubmit={handleCreateCampaign}>
            <div className="form-group">
              <label htmlFor="template-select">Choose template</label>
              <select
                id="template-select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={templates.length === 0}
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {templates.length === 0 && (
              <div className="alert">
                No templates available yet. Visit the <strong>Templates</strong> page to create your first template.
              </div>
            )}

            <div className="form-group">
              <label>Choose recipients</label>
              {contacts.length === 0 ? (
                <div className="alert">No saved contacts available. Import contacts first.</div>
              ) : (
                <>
                  <label className="footer-note" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={selectedContactIds.length === contacts.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    Select all {contacts.length} contacts
                  </label>
                  <div className="table-wrapper" style={{ marginTop: 12, maxHeight: 260, overflowY: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Company</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((contact) => (
                          <tr key={contact.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedContactIds.includes(contact.id)}
                                onChange={() => handleContactToggle(contact.id)}
                              />
                            </td>
                            <td>{contact.name}</td>
                            <td>{contact.email}</td>
                            <td>{contact.company}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="scheduled-at">Schedule send</label>
              <input
                id="scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                disabled={templates.length === 0}
              />
              <div className="footer-note">Leave empty to send immediately.</div>
            </div>

            <button className="button" type="submit" disabled={templates.length === 0 || contacts.length === 0 || !selectedTemplate || selectedContactIds.length === 0}>
              {scheduledAt ? 'Schedule campaign' : 'Send now'}
            </button>
          </form>
        </div>

        {selectedTemplateObject && (
          <div className="card" style={{ marginTop: 26 }}>
            <h3>Selected template preview</h3>
            {selectedContactIds.length > 0 ? (
              <div className="footer-note">
                Showing preview for <strong>{previewContact.name}</strong> ({previewContact.email}).
              </div>
            ) : (
              <div className="footer-note">
                Select a contact to preview the template with real recipient data.
              </div>
            )}
            <strong>{selectedTemplateObject.subject}</strong>
            <p>{renderTemplate(selectedTemplateObject.body, previewContact)}</p>
          </div>
        )}

        <section className="section-panel">
          <h2>Campaign history</h2>
          {campaigns.length === 0 ? (
            <div className="alert">No campaigns yet. Start by creating one.</div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Recipients</th>
                    <th>Scheduled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>{campaign.name}</td>
                      <td>
                        <span className={`status-pill status-${campaign.status}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td>{campaign.recipientCount}</td>
                      <td>{new Date(campaign.scheduledAt).toLocaleString()}</td>
                      <td>
                        <button className="button-secondary" onClick={() => setViewDetails(campaign)} style={{ padding: '4px 12px', fontSize: '13px' }}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {viewDetails && (
          <div className="modal-overlay" onClick={() => setViewDetails(null)}>
            <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Campaign Details: {viewDetails.name}</h2>
                <button className="button-icon" onClick={() => setViewDetails(null)}>✕</button>
              </div>
              
              <div className="card-grid" style={{ marginBottom: 24 }}>
                <div className="card">
                  <strong>{viewDetails.status}</strong>
                  <div>Overall Status</div>
                </div>
                <div className="card">
                  <strong>{viewDetails.deliveredCount} / {viewDetails.recipientCount}</strong>
                  <div>Delivered</div>
                </div>
              </div>

              <h3>Recipient Log</h3>
              <div className="table-wrapper" style={{ maxHeight: '400px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Error / Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetails.recipients.map((r) => (
                      <tr key={r.id}>
                        <td>{r.email}</td>
                        <td>
                          <span className={`status-pill status-${r.status}`}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ color: r.status === 'failed' ? '#f87171' : 'inherit', fontSize: '13px' }}>
                          {r.error || (r.status === 'sent' ? 'Delivered successfully' : '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Campaigns;
