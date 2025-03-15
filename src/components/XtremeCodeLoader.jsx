// src/components/XtremeCodeLoader.jsx
import { useState } from 'react';
import { useIPTV } from '../contexts/IPTVContext';
import { getXtremeLiveStreams } from '../utils/xtremeCodeApi';

export default function XtremeCodeLoader() {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const { setChannels, addChannels } = useIPTV(); // REMOVED setLoading from here
  const [mode, setMode] = useState('replace'); // 'replace' or 'add'
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true); // Use local state instead
    
    try {
      // Sanitize the URL
      let url = serverUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
      }
      
      const channels = await getXtremeLiveStreams(url, username, password);
      
      if (mode === 'replace') {
        setChannels(channels);
        setSuccess(`Successfully loaded ${channels.length} channels!`);
      } else {
        addChannels(channels);
        setSuccess(`Successfully added ${channels.length} channels!`);
      }
      
      // Save provider info for troubleshooting
      localStorage.setItem('iptv-provider-info', JSON.stringify({
        serverUrl: url,
        username,
        password
      }));
      
      // Clear form after successful operation
      if (channels.length > 0) {
        setServerUrl('');
        setUsername('');
        setPassword('');
      }
    } catch (err) {
      setError('Failed to load channels from Xtreme Code API. Please check your credentials and server URL.');
      console.error('XtremeCode error:', err);
    } finally {
      setIsLoading(false); // Use local state instead
    }
  };
  
  // Rest of the component remains the same
  return (
    <div className="xtreme-loader">
      <h3>Connect to Xtreme Codes API</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="server-url">Server URL</label>
          <input
            id="server-url"
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="example.com:port"
            required
            disabled={isLoading}
          />
          <small>Enter with or without http:// prefix</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label>Channel Import Mode</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
                disabled={isLoading}
              />
              Replace existing channels
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="add"
                checked={mode === 'add'}
                onChange={() => setMode('add')}
                disabled={isLoading}
              />
              Add to existing channels
            </label>
          </div>
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect'}
        </button>
      </form>
      
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      
      <div className="xtreme-help">
        <h4>Need help?</h4>
        <p>Enter the server URL, username, and password provided by your IPTV service.</p>
        <p>Format example: domain.com:port</p>
      </div>
    </div>
  );
}
