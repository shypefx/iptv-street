// src/components/ChannelList.jsx
import React from 'react';
import { useIptv } from '../context/IptvContext';
import ChannelFilters from './ChannelFilters';
import '../styles/ChannelList.css';

const ChannelList = () => {
  const { 
    channels,                // Gardons l'accès aux channels originaux
    filteredChannels,        // Utiliser filteredChannels pour l'affichage
    selectedChannel, 
    setSelectedChannel,
    loading,
    updateLastViewedChannels,
    error
  } = useIptv();
  
  if (loading) {
    return <div className="loading">Chargement des chaînes...</div>;
  }

  if (error) {
    return <div className="error-message">Erreur: {error}</div>;
  }

  if (!channels || channels.length === 0) {
    return <div className="no-channels">Aucune chaîne disponible. Veuillez vérifier votre connexion au serveur.</div>;
  }

  // Gérer le clic sur une chaîne
  const handleChannelClick = (channel) => {
    if (channel && channel.stream_id) {
      console.log('Channel selected:', channel);
      setSelectedChannel(channel);
      updateLastViewedChannels(channel);
    } else {
      console.error('Invalid channel data:', channel);
    }
  };
  
  // Vérifions si filteredChannels est un tableau
  const channelsToDisplay = Array.isArray(filteredChannels) ? filteredChannels : [];
  console.log('Channels to display:', channelsToDisplay.length);
  
  return (
    <div className="channel-list-container">
      {/* Ajouter le composant de filtres ici */}
      <ChannelFilters />
      
      <div className="channel-list">
        {channelsToDisplay.length > 0 ? (
          channelsToDisplay.map(channel => {
            // Vérification de validité des données
            if (!channel || !channel.stream_id) {
              console.warn('Invalid channel data in list:', channel);
              return null;
            }
            
            return (
              <div 
                key={`channel-${channel.stream_id}`}  // Préfixe pour garantir l'unicité
                className={`channel-item ${selectedChannel && channel.stream_id === selectedChannel.stream_id ? 'selected' : ''}`}
                onClick={() => handleChannelClick(channel)}
              >
                <div className="channel-name">{channel.name || 'Sans nom'}</div>
                <div className="channel-meta">
                  {channel.country && <span className="channel-country">{channel.country}</span>}
                  {channel.channelType && <span className="channel-type">{channel.channelType}</span>}
                  {channel.quality && <span className={`channel-quality ${channel.quality}`}>{channel.quality}</span>}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-channels">
            Aucune chaîne ne correspond aux filtres sélectionnés.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelList;
