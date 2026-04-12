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
            <div>Campaigns created</div>
          </div>
        </div>

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
