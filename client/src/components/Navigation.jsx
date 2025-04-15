import { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useIptv } from '../context/IptvContext.jsx';
import { AuthContext } from '../context/AuthContext'; // Import the AuthContext
import '../styles/Navigation.css';
// Vous pouvez importer des icônes si nécessaire, par exemple de react-icons
// import { AiOutlineHome, AiOutlinePlayCircle, AiOutlineSetting, AiOutlineMenu, AiOutlineUser, AiOutlineLogout } from 'react-icons/ai';

export default function Navigation() {
  const { loading } = useIptv();
  const { currentUser, logout } = useContext(AuthContext); // Get auth context data
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
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
          {currentUser ? (
            // Links for authenticated users
            <>
              <NavLink to="/" end className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                {/* <AiOutlineHome /> */}
                Home
              </NavLink>
              <NavLink to="/watch" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                {/* <AiOutlinePlayCircle /> */}
                Watch
              </NavLink>
              <NavLink to="/settings" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                {/* <AiOutlineSetting /> */}
                Settings
              </NavLink>
              <NavLink to="/profile" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                {/* <AiOutlineUser /> */}
                Profile
              </NavLink>
              <button onClick={handleLogout} className="logout-btn nav-link">
                {/* <AiOutlineLogout /> */}
                Logout
              </button>
              {currentUser && (
                <div className="user-greeting">
                  Hi, {currentUser.username}
                </div>
              )}
            </>
          ) : (
            // Links for non-authenticated users
            <>
              <NavLink to="/login" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Login
              </NavLink>
              <NavLink to="/register" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Register
              </NavLink>
            </>
          )}
          
          {loading && <div className="loading-indicator">Loading...</div>}
        </div>
      </div>
    </nav>
  );
}
