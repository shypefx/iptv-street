// src/components/StreamTroubleshooter.jsx - Enhanced version
import { useState } from 'react';
import { useIptv } from '../context/IptvContext.jsx';

import { getAlternativeStreamUrl } from '../utils/xtremeCodeApi';

export default function StreamTroubleshooter({ serverUrl, username, password }) {
  const { currentChannel, setCurrentChannel } = useIptv();
  const [isOpen, setIsOpen] = useState(false);
  const [urlFormat, setUrlFormat] = useState(0); // Index into alternatives array
  const [usedFormats, setUsedFormats] = useState([]);
  
  if (!currentChannel) return null;
  
  const refreshToken = () => {
    if (!currentChannel) return;
    
    // Generate a new timestamp to force a token refresh
    const timestamp = Date.now();
    let newUrl;
    
    if (currentChannel.url.includes('token=')) {
      // For URLs with tokens, strip the token and add a new random one
      const baseUrl = currentChannel.url.split('?')[0];
      newUrl = `${baseUrl}?token=${Math.random().toString(36).substr(2)}&_=${timestamp}`;
    } else {
      // Just add a cache buster
      if (currentChannel.url.includes('?')) {
        newUrl = `${currentChannel.url}&_=${timestamp}`;
      } else {
        newUrl = `${currentChannel.url}?_=${timestamp}`;
      }
    }
    
    console.log('Refreshed stream URL:', newUrl);
    
    setCurrentChannel({
      ...currentChannel,
      url: newUrl
    });
  };
  
  const tryNextFormat = () => {
    if (!currentChannel || !serverUrl || !username || !password) return;
    
    // Get all possible URL formats
    const streamId = currentChannel.id;
    const alternatives = getAlternativeStreamUrl(serverUrl, username, password, streamId);
    
    // Track which format we've tried
    setUsedFormats([...usedFormats, urlFormat]);
    
    // Get next format, wrapping around if needed
    const nextFormat = (urlFormat + 1) % alternatives.length;
    setUrlFormat(nextFormat);
    
    const newUrl = alternatives[nextFormat];
    console.log(`Trying format ${nextFormat + 1}/${alternatives.length}:`, newUrl);
    
    setCurrentChannel({
      ...currentChannel,
      url: newUrl
    });
  };
  
  // Force the transport stream format specifically
  const forceTS = () => {
    if (!currentChannel) return;
    
    let newUrl = currentChannel.url;
    
    // Replace extension with .ts if present
    if (newUrl.includes('.m3u8')) {
      newUrl = newUrl.replace('.m3u8', '.ts');
    } else if (!newUrl.includes('.ts')) {
      // If no extension, add .ts
      const urlParts = newUrl.split('?');
      if (urlParts[0].endsWith('/')) {
        newUrl = `${urlParts[0]}index.ts${urlParts[1] ? '?' + urlParts[1] : ''}`;
      } else {
        newUrl = `${urlParts[0]}.ts${urlParts[1] ? '?' + urlParts[1] : ''}`;
      }
    }
    
    // Add timestamp to force refresh
    const timestamp = Date.now();
    if (newUrl.includes('?')) {
      newUrl = `${newUrl}&_=${timestamp}`;
    } else {
      newUrl = `${newUrl}?_=${timestamp}`;
    }
    
    console.log('Forcing TS format:', newUrl);
    
    setCurrentChannel({
      ...currentChannel,
      url: newUrl
    });
  };
  
  // Try a completely direct approach without tokens
  const tryDirectStream = () => {
    if (!currentChannel || !serverUrl) return;
    
    // Use a very basic direct URL format
    const streamId = currentChannel.id;
    const baseUrl = serverUrl.includes('://') ? serverUrl : `http://${serverUrl}`;
    const timestamp = Date.now();
    
    // Create a direct URL that bypasses token authentication
    // This may work on some providers that have fallback options
    const directUrl = `${baseUrl}/live/${streamId}.ts?_=${timestamp}`;
    
    console.log('Trying direct stream URL:', directUrl);
    
    setCurrentChannel({
      ...currentChannel,
      url: directUrl
    });
  };
  
  return (
    <div className="troubleshooter">
      <button 
        className="troubleshoot-toggle" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide Troubleshooter' : 'Channel Not Playing?'}
      </button>
      
      {isOpen && (
        <div className="troubleshoot-panel">
          <h4>Stream Troubleshooter</h4>
          <p>Try these options to fix playback issues:</p>
          
          <div className="troubleshoot-actions">
            <button onClick={refreshToken} className="troubleshoot-btn">
              Refresh Token
            </button>
            <button onClick={tryNextFormat} className="troubleshoot-btn">
              Try Next Format
            </button>
            <button onClick={forceTS} className="troubleshoot-btn">
              Force TS Format
            </button>
            <button onClick={tryDirectStream} className="troubleshoot-btn">
              Try Direct Stream
            </button>
          </div>
          
          <div className="troubleshoot-tips">
            <h5>Common Issues:</h5>
            <ul>
              <li>Tokens expire frequently - use "Refresh Token" to get a new one</li>
              <li>Some streams require specific formats (TS vs HLS)</li>
              <li>Certain channels may be geo-blocked (try with VPN)</li>
              <li>The stream may require specific player capabilities</li>
              <li>Try using a different browser (Chrome/Firefox/Safari)</li>
            </ul>
            
            <div className="advanced-info">
              <details>
                <summary>Stream Details</summary>
                <p><strong>Current URL:</strong> <code>{currentChannel.url}</code></p>
                <p><strong>Stream ID:</strong> {currentChannel.id}</p>
                <p><strong>Format Type:</strong> {
                  currentChannel.url.includes('.m3u8') ? 'HLS (m3u8)' :
                  currentChannel.url.includes('.ts') ? 'TS (Transport Stream)' :
                  'Unknown'
                }</p>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
