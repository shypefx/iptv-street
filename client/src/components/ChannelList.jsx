// src/components/ChannelList.jsx
import React from 'react';
import '../styles/ChannelList.css';

const ChannelList = ({ channels, onChannelSelect, selectedChannel }) => {
  // 1. Ajouter une vérification pour s'assurer que channels existe
  if (!channels) {
    return <div className="loading-channels">Chargement des chaînes...</div>;
  }

  // 2. Ou si vous préférez, utilisez un tableau vide par défaut
  // const safeChannels = channels || [];

  return (
    <div className="channel-list">
      <div className="channel-list-header">
        <h3>Chaînes disponibles</h3>
        <span className="channel-count">{channels.length} chaînes</span>
      </div>
      
      <div className="channel-list-content">
        {/* 3. Maintenant channels est garanti d'être un tableau */}
        {channels.map(channel => (
          <div 
            key={channel.id || channel.name}
            className={`channel-item ${selectedChannel && selectedChannel.name === channel.name ? 'selected' : ''}`}
            onClick={() => onChannelSelect(channel)}
          >
            {channel.logo && (
              <img 
                src={channel.logo} 
                alt={channel.name} 
                className="channel-logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="channel-details">
              <div className="channel-name">{channel.name}</div>
              {channel.category && <div className="channel-category">{channel.category}</div>}
            </div>
          </div>
        ))}
        
        {channels.length === 0 && (
          <div className="no-channels-message">
            Aucune chaîne disponible. Veuillez vérifier vos paramètres.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelList;
