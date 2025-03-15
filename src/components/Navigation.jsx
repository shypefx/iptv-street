import { NavLink } from 'react-router-dom';
import { useIPTV } from '../contexts/IPTVContext';

export default function Navigation() {
  const { loading } = useIPTV();
  
  return (
    <nav className="nav">
      <ul>
        <li>
          <NavLink to="/" end>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/watch">
            Watch
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings">
            Settings
          </NavLink>
        </li>
      </ul>
      
      {loading && <div className="loading-indicator">Loading...</div>}
    </nav>
  );
}
