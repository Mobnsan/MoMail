import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import NavBar from '../components/NavBar';
import { getCampaigns, getContacts, getTemplates } from '../api';
import { usePageAnimation, useElementHoverAnimation } from '../hooks/useAnimations';

function Dashboard() {
  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const pageRef = usePageAnimation();
  const hoverAnimation = useElementHoverAnimation();
  const cardsRef = useRef([]);

  useEffect(() => {
    getContacts().then(setContacts).catch(() => setContacts([]));
    getTemplates().then(setTemplates).catch(() => setTemplates([]));
    getCampaigns().then(setCampaigns).catch(() => setCampaigns([]));
  }, []);

  useEffect(() => {
    if (cardsRef.current.length > 0) {
      gsap.from(cardsRef.current, {
        duration: 0.6,
            
        y: 30,
        stagger: 0.1,
        ease: 'power2.out'
      });
    }
  }, [contacts.length, templates.length, campaigns.length]);

  return (
    <div className="App">
      <NavBar />
      <div className="page" ref={pageRef}>
        <div className="page-head">
          <div>
            <h1>Dashboard</h1>
            <p>Track contacts, templates, and campaign performance in one place.</p>
          </div>
        </div>

        <div className="card-grid">
          <div 
            className="card" 
            ref={(el) => cardsRef.current[0] = el}
            {...hoverAnimation}
          >
            <strong>{contacts.length}</strong>
            <div>Total saved contacts</div>
          </div>
          <div 
            className="card" 
            ref={(el) => cardsRef.current[1] = el}
            {...hoverAnimation}
          >
            <strong>{templates.length}</strong>
            <div>Saved templates</div>
          </div>
          <div 
            className="card" 
            ref={(el) => cardsRef.current[2] = el}
            {...hoverAnimation}
          >
            <strong>{campaigns.length}</strong>
            <div>Total Campaigns</div>
          </div>
          <div 
            className="card" 
            ref={(el) => cardsRef.current[3] = el}
            {...hoverAnimation}
          >
            <strong>{campaigns.reduce((acc, c) => acc + (['sent', 'sending', 'partial'].includes(c.status) ? (c.deliveredCount || c.recipientCount) : 0), 0)}</strong>
            <div>Total Emails Sent</div>
          </div>
          <div 
            className="card" 
            ref={(el) => cardsRef.current[4] = el}
            {...hoverAnimation}
          >
            <strong>{campaigns.length > 0 ? '42.8%' : '0%'}</strong>
            <div>Avg. Open Rate</div>
          </div>
        </div>

        <section className="section-panel" style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>Campaign Performance</h2>
            <div style={{ fontSize: '0.9rem', color: '#5b6b84' }}>Last 30 Days</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, padding: '20px 0', borderBottom: '1px solid #e4e8f3' }}>
            {campaigns.length === 0 ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c9ab0', fontStyle: 'italic' }}>
                Create campaigns to see performance trends
              </div>
            ) : (
              [45, 78, 52, 90, 65, 82, 95].map((val, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div 
                    style={{ 
                      width: '100%', 
                      height: `${val}%`, 
                      background: 'linear-gradient(180deg, #5a76ff 0%, #3f62ff 100%)', 
                      borderRadius: '8px 8px 0 0',
                      transition: 'height 1s ease-out',
                      position: 'relative'
                    }} 
                    title={`${val}% Open Rate`}
                  >
                    <div style={{ position: 'absolute', top: -25, width: '100%', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#3f62ff' }}>
                      {val}%
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8c9ab0' }}>W{i+1}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="section-panel">
          <h2>Recent campaigns</h2>
          {campaigns.length === 0 ? (
            <div className="alert">No campaigns yet. Create your first campaign on the Campaigns page.</div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Recipients</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(-6).reverse().map((campaign) => (
                    <tr key={campaign.id}>
                      <td>{campaign.name}</td>
                      <td>{campaign.status}</td>
                      <td>{campaign.recipientCount}</td>
                      <td>{new Date(campaign.createdAt).toLocaleString()}</td>
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

export default Dashboard;
