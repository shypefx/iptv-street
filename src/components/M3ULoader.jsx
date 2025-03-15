// src/components/M3ULoader.jsx
import { useState } from 'react';
import { useIPTV } from '../contexts/IPTVContext';
import { parseM3UContent } from '../utils/m3uParser';

export default function M3ULoader() {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const { setChannels, addChannels } = useIPTV(); // REMOVED setLoading from here
  const [mode, setMode] = useState('replace'); // 'replace' or 'add'
  const [success, setSuccess] = useState('');
  
  const handleUrlLoad = async (e) => {
    e.preventDefault();
    
    if (!url) {
      setUrlError('Please enter a valid M3U URL');
      return;
    }
    
    setUrlError('');
    setSuccess('');
    setIsLoading(true); // Use local state instead
    
    try {
      // Save the URL for future use
      localStorage.setItem('iptv-playlist-url', url);
      
      // Fetch and parse the M3U file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch M3U: ${response.status}`);
      }
      
      const content = await response.text();
      const channels = parseM3UContent(content);
      
      if (channels.length === 0) {
        setUrlError('No channels found in the M3U file');
      } else {
        if (mode === 'replace') {
          setChannels(channels);
        } else {
          addChannels(channels);
        }
        setSuccess(`Successfully ${mode === 'replace' ? 'loaded' : 'added'} ${channels.length} channels!`);
        setUrl('');
      }
    } catch (err) {
      console.error('Error loading M3U:', err);
      setUrlError(`Failed to load M3U: ${err.message}`);
    } finally {
      setIsLoading(false); // Use local state instead
    }
  };
  
  // Rest of component remains the same
  return (
    <div className="m3u-loader">
      <h3>Load M3U Playlist</h3>
      
      <form onSubmit={handleUrlLoad}>
        <div className="form-group">
          <label htmlFor="m3u-url">M3U URL</label>
          <input
            id="m3u-url"
            type="url"
            placeholder="https://example.com/playlist.m3u"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label>Import Mode</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="m3u-mode"
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
                name="m3u-mode"
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
          {isLoading ? 'Loading...' : 'Load Channels'}
        </button>
      </form>
      
      {urlError && <p className="error">{urlError}</p>}
      {success && <p className="success">{success}</p>}
      
      <div className="m3u-help">
        <h4>Need help?</h4>
        <p>Enter the URL of your M3U playlist to load all channels.</p>
        <p>This is usually provided by your IPTV service.</p>
      </div>
    </div>
  );
}
