// src/pages/Login.jsx
import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useIptv } from '../context/IptvContext';
import '../styles/Auth.css'; // Make sure to create this CSS file

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, error, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const { loadChannels, lastUpdated, refreshChannels } = useIptv();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!username || !password) {
      setFormError('Username and password are required');
      return;
    }

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Log in to IPTV Street</h2>
        
        {(error || formError) && (
          <div className="auth-error">
            {formError || error}
          </div>
        )}

        {lastUpdated && (
          <div className="cached-info">
            <p>Last updated: {lastUpdated}</p>
            <button 
              onClick={refreshChannels} 
              disabled={loading}
              className="refresh-button"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="auth-redirect">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
