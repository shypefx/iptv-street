// src/components/XtremeCodeLoader.jsx
import React, { useState, useEffect } from 'react';
import { useIptv } from '../context/IptvContext';
import '../styles/XtremeCodeLoader.css';

const XtremeCodeLoader = ({ onSuccess }) => {
  // Get the needed functions and states from IPTV context
  const { 
    channels, 
    loading, 
    error, 
    isAuthenticated, 
    login, 
    logout, 
    handleClearCache,
    lastUpdated
  } = useIptv();
  
  // Local form state
  const [formData, setFormData] = useState({
    serverUrl: '',
    username: '',
    password: ''
  });

  // Local states for form-specific error/success messages
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved auth info
  useEffect(() => {
    const savedAuth = localStorage.getItem('iptv_auth');
    if (savedAuth) {
      try {
        const { serverUrl, username, password } = JSON.parse(savedAuth);
        setFormData({ serverUrl, username, password });
      } catch (e) {
        console.error("Error loading saved auth info:", e);
      }
    }
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      // Validate form fields
      if (!formData.serverUrl || !formData.username || !formData.password) {
        setFormError('All fields are required');
        setIsSubmitting(false);
        return;
      }

      // Call login function from context
      const success = await login(formData.serverUrl, formData.username, formData.password);
      
      if (success) {
        // Save auth info
        localStorage.setItem('iptv_auth', JSON.stringify(formData));
        setFormSuccess('Login successful! Loading French channels only.');
        
        // Call success callback if provided
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
      } else {
        setFormError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setFormError(err.message || "Connection error. Please check your information and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="xtreme-code-container">
      {/* Header with login form */}
      <div className="xtreme-header">
        {isAuthenticated ? (
          <div className="header-connected">
            <div className="header-info">
              <h3 className="header-title">French IPTV Player ({channels.length} channels)</h3>
              <div className="header-subtitle">
                {formData.serverUrl} - {formData.username}
                {lastUpdated && ` - Last updated: ${lastUpdated}`}
              </div>
            </div>
            <div className="header-actions">
              <button 
                onClick={handleClearCache} 
                className="clear-cache-button"
              >
                Clear Cache
              </button>
              <button 
                onClick={logout} 
                className="logout-button"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="text"
              name="serverUrl"
              value={formData.serverUrl}
              onChange={handleChange}
              placeholder="Server URL"
              required
              className="form-input"
              disabled={isSubmitting}
            />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              required
              className="form-input"
              disabled={isSubmitting}
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="form-input"
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              disabled={isSubmitting || loading} 
              className={`form-button ${isSubmitting || loading ? 'button-disabled' : ''}`}
            >
              {isSubmitting || loading ? 'Connecting...' : 'Connect (French Channels Only)'}
            </button>
          </form>
        )}
        
        {(error || formError) && (
          <div className="error-message">
            {formError || error}
          </div>
        )}
        
        {formSuccess && (
          <div className="success-message">
            {formSuccess}
          </div>
        )}
      </div>
      
      {/* Loading overlay */}
      {(loading || isSubmitting) && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading French channels only...</p>
        </div>
      )}
    </div>
  );
};

export default XtremeCodeLoader;
