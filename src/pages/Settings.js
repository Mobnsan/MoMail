import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import NavBar from '../components/NavBar';
import { getSettings, saveSettings } from '../api';
import { usePageAnimation } from '../hooks/useAnimations';

function Settings() {
  const [provider, setProvider] = useState('console');
  const [fromEmail, setFromEmail] = useState('');
  const [providerConfig, setProviderConfig] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');
  const pageRef = usePageAnimation();
  const cardsRef = useRef([]);

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setProvider(settings.provider || 'console');
        setFromEmail(settings.fromEmail || '');
        setProviderConfig(settings.providerConfig || {});
      })
      .catch(() => {
        setProvider('console');
        setFromEmail('');
        setProviderConfig({});
      });


    if (cardsRef.current.length > 0) {
      gsap.from(cardsRef.current, {
        duration: 0.6,
             
        y: 20,
        stagger: 0.15,
        ease: 'power2.out'
      });
    }
  }, []);

  async function handleConnectClick() {
    setSaving(true);
    setStatusMessage('');
    setConnectMessage('');

    try {
      await saveSettings({ provider, providerConfig, fromEmail });
      setConnectMessage('Email provider connected successfully.');
    } catch (error) {
      setConnectMessage(error.message || 'Unable to connect provider.');
    } finally {
      setSaving(false);
    }
  }

  function updateConfig(field, value) {
    setProviderConfig((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setStatusMessage('');
    setConnectMessage('');

    try {
      await saveSettings({ provider, fromEmail, providerConfig });
      setStatusMessage('Settings saved successfully.');
    } catch (error) {
      setStatusMessage(error.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="App">
      <NavBar />
      <div className="page" ref={pageRef}>
        <div className="page-head">
          <div>
            <h1>Mail settings</h1>
            <p>Configure SMTP, SendGrid, or Mailgun settings for real email delivery.</p>
          </div>
        </div>

        {statusMessage && <div className="alert">{statusMessage}</div>}
        {connectMessage && <div className="alert">{connectMessage}</div>}

        <div className="card" ref={(el) => cardsRef.current[0] = el} style={{ marginBottom: 20 }}>
          <h2>Connect provider</h2>
          <p>Paste your SendGrid key or enter SMTP/Mailgun details below, then click Connect provider.</p>
          <button type="button" className="button" onClick={handleConnectClick} disabled={saving}>
            Connect provider automatically
          </button>
          <div className="footer-note" style={{ marginTop: 12 }}>
            This saves the provider settings from the form below and uses the selected provider.
          </div>
        </div>

        <div className="card" ref={(el) => cardsRef.current[1] = el}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="provider">Email provider</label>
              <select id="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="console">Console simulator</option>
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="mailgun">Mailgun</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="from-email">Sender address</label>
              <input
                id="from-email"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="no-reply@yourdomain.com"
              />
              <div className="footer-note">This address will appear in the email From field.</div>
            </div>

            {provider === 'smtp' && (
              <>
                <div className="form-group">
                  <label htmlFor="smtp-host">SMTP host</label>
                  <input
                    id="smtp-host"
                    type="text"
                    value={providerConfig.smtpHost || ''}
                    onChange={(e) => updateConfig('smtpHost', e.target.value)}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="smtp-port">SMTP port</label>
                  <input
                    id="smtp-port"
                    type="number"
                    value={providerConfig.smtpPort || ''}
                    onChange={(e) => updateConfig('smtpPort', e.target.value)}
                    placeholder="587"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="smtp-user">SMTP username</label>
                  <input
                    id="smtp-user"
                    type="text"
                    value={providerConfig.smtpUser || ''}
                    onChange={(e) => updateConfig('smtpUser', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="smtp-pass">SMTP password</label>
                  <input
                    id="smtp-pass"
                    type="password"
                    value={providerConfig.smtpPass || ''}
                    onChange={(e) => updateConfig('smtpPass', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="footer-note" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={providerConfig.smtpSecure === true}
                      onChange={(e) => updateConfig('smtpSecure', e.target.checked)}
                    />
                    Use a secure SMTP connection (SSL/TLS)
                  </label>
                </div>
              </>
            )}

            {provider === 'sendgrid' && (
              <div className="form-group">
                <label htmlFor="sendgrid-key">SendGrid API key</label>
                <input
                  id="sendgrid-key"
                  type="text"
                  value={providerConfig.sendgridApiKey || ''}
                  onChange={(e) => updateConfig('sendgridApiKey', e.target.value)}
                />
              </div>
            )}

            {provider === 'mailgun' && (
              <>
                <div className="form-group">
                  <label htmlFor="mailgun-key">Mailgun API key</label>
                  <input
                    id="mailgun-key"
                    type="text"
                    value={providerConfig.mailgunApiKey || ''}
                    onChange={(e) => updateConfig('mailgunApiKey', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mailgun-domain">Mailgun domain</label>
                  <input
                    id="mailgun-domain"
                    type="text"
                    value={providerConfig.mailgunDomain || ''}
                    onChange={(e) => updateConfig('mailgunDomain', e.target.value)}
                  />
                </div>
              </>
            )}

            <button className="button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save email settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Settings;
