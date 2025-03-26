import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useIptv } from '../context/IptvContext.jsx';
import '../styles/Navigation.css';
// Vous pouvez importer des icônes si nécessaire, par exemple de react-icons
// import { AiOutlineHome, AiOutlinePlayCircle, AiOutlineSetting, AiOutlineMenu } from 'react-icons/ai';

export default function Navigation() {
  const { loading } = useIptv();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <NavLink to="/" className="logo">
          {/* Vous pouvez ajouter un logo ici */}
          {/* <img src="/logo.png" alt="IPTV Street" /> */}
          IPTV Street
        </NavLink>

        {/* Bouton menu mobile */}
        <button 
          className="mobile-menu-btn" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {/* Si vous avez installé react-icons */}
          {/* <AiOutlineMenu /> */}
          ☰
        </button>

        {/* Liens de navigation */}
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          <NavLink to="/" end className="nav-link">
            {/* <AiOutlineHome /> */}
            Home
          </NavLink>
          <NavLink to="/watch" className="nav-link">
            {/* <AiOutlinePlayCircle /> */}
            Watch
          </NavLink>
          <NavLink to="/settings" className="nav-link">
            {/* <AiOutlineSetting /> */}
            Settings
          </NavLink>
          
          {loading && <div className="loading-indicator">Loading...</div>}
        </div>
      </div>
    </nav>
  );
}
