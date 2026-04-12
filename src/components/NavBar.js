import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { getCurrentUser, logout } from '../api';
import { useTheme } from '../context/ThemeContext';

function NavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { isDark, toggleTheme } = useTheme();
  const themeToggleRef = useRef(null);
  const navbarRef = useRef(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));

    if (navbarRef.current) {
      gsap.from(navbarRef.current, {
        duration: 0.6,
        
        ease: 'power2.out'
      });
    }
  }, []);

  const handleThemeToggle = () => {
    if (themeToggleRef.current) {
      gsap.to(themeToggleRef.current, {
        duration: 0.6,
        rotation: 360,
        ease: 'back.out'
      });
    }
    toggleTheme();
  };

  async function handleLogout() {
    await logout();
    navigate('/signin');
  }

  return (
    <div className="navbar" ref={navbarRef}>
      <div>
        <strong>MoMail</strong>
        <div className="footer-note">{user?.email || 'Campaign dashboard'}</div>
      </div>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink>
        <NavLink to="/contacts" className={({ isActive }) => (isActive ? 'active' : '')}>Contacts</NavLink>
        <NavLink to="/templates" className={({ isActive }) => (isActive ? 'active' : '')}>Templates</NavLink>
        <NavLink to="/campaigns" className={({ isActive }) => (isActive ? 'active' : '')}>Campaigns</NavLink>
        <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>Settings</NavLink>
        <button
          className="theme-toggle"
          onClick={handleThemeToggle}
          type="button"
          title="Toggle theme"
          ref={themeToggleRef}
        >
          <img src={isDark ? '/sun.svg' : '/moon.svg'} alt="Theme toggle" className="theme-icon" />
        </button>
        <button className="small-button" onClick={handleLogout} type="button">
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default NavBar;
