// src/components/DebugPanel.jsx
import { useState } from 'react';
import { useIPTV } from '../contexts/IPTVContext';

function DebugPanel() {
  const { channels } = useIPTV();
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState('');
  const [showSample, setShowSample] = useState(false);

  // Get a single channel for structure examination
  const sampleChannel = channels.length > 0 ? channels[0] : null;

  // Filter channels by name if filter is applied
  const filteredChannels = filter 
    ? channels.filter(ch => ch.name?.toLowerCase().includes(filter.toLowerCase()))
    : channels;

  return (
    <div className="debug-panel">
      <button 
        className="debug-toggle" 
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? 'Hide Debug Panel' : 'Show Debug Panel'}
      </button>
      
      {isVisible && (
        <div className="debug-content">
          <h3>Channel Data Inspector</h3>
          
          <div className="debug-controls">
            <div className="debug-info">
              <strong>Total Channels:</strong> {channels.length}
            </div>
            
            <input
              type="text"
              placeholder="Filter by channel name"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="debug-filter"
            />
            
            <label className="debug-sample-toggle">
              <input 
                type="checkbox" 
                checked={showSample} 
                onChange={() => setShowSample(!showSample)} 
              />
              Show sample structure
            </label>
          </div>
          
          {showSample && sampleChannel && (
            <div className="debug-sample">
              <h4>Channel Structure (First Channel)</h4>
              <pre>{JSON.stringify(sampleChannel, null, 2)}</pre>
            </div>
          )}
          
          <div className="debug-channels-table">
            <h4>Channels List {filter ? `(Filtered: ${filteredChannels.length} results)` : ''}</h4>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Group</th>
                  <th>Stream URL</th>
                  <th>Has Logo</th>
                </tr>
              </thead>
              <tbody>
                {filteredChannels.slice(0, 100).map(channel => (
                  <tr key={channel.id}>
                    <td>{channel.id}</td>
                    <td>{channel.name}</td>
                    <td>{channel.group || '-'}</td>
                    <td className="url-cell">
                      <div className="url-wrapper" title={channel.stream_url}>
                        {channel.stream_url}
                      </div>
                    </td>
                    <td>{channel.logo ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredChannels.length > 100 && (
              <div className="debug-note">
                * Showing first 100 channels. Filter to see more specific results.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DebugPanel;
