// src/components/XtremeCodeLoader.jsx
import React from 'react';
import { useIptv } from '../context/IPTVContext';
import VirtualizedChannelList from './VirtualizedChannelList';
import VideoPlayer from './Player';
import '../styles/XtremeCodeLoader.css';

const XtremeCodeLoader = () => {
  const { 
    serverUrl, setServerUrl, 
    username, setUsername, 
    password, setPassword, 
    channels, selectedChannel, 
    setSelectedChannel, loading, error, 
    isAuthenticated, login, logout, handleClearCache 
  } = useIptv();
  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    await login(serverUrl, username, password);
  };
  
  return (
    <div className="xtreme-code-container">
      {/* Barre d'en-tête avec formulaire de connexion */}
      <div className="xtreme-header">
        {isAuthenticated ? (
          <div className="header-connected">
            <div className="header-info">
              <h3 className="header-title">IPTV Player ({channels.length} chaînes)</h3>
              <div className="header-subtitle">{serverUrl} - {username}</div>
            </div>
            <div className="header-actions">
              <button 
                onClick={handleClearCache} 
                className="clear-cache-button"
              >
                Vider le cache
              </button>
              <button 
                onClick={logout} 
                className="logout-button"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="URL du serveur"
              required
              className="form-input"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nom d'utilisateur"
              required
              className="form-input"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              className="form-input"
            />
            <button 
              type="submit" 
              disabled={loading} 
              className={`form-button ${loading ? 'button-disabled' : ''}`}
            >
              {loading ? 'Chargement...' : 'Connecter'}
            </button>
          </form>
        )}
        
        {error && <div className="error-message">{error}</div>}
      </div>
      
      {/* Contenu principal */}
      {isAuthenticated && (
        <div className="xtreme-main-content">
          {/* Liste des chaînes */}
          <div className="channels-list">
            <VirtualizedChannelList
              channels={channels}
              onChannelSelect={setSelectedChannel}
              selectedChannel={selectedChannel}
            />
          </div>
          
          {/* Lecteur vidéo */}
          <div className="player-container">
            {selectedChannel ? (
              <>
                <div className="channel-info">
                  <h3 className="channel-title">{selectedChannel.name}</h3>
                  <div className="channel-category">{selectedChannel.category}</div>
                </div>
                <div className="player-wrapper">
                  <VideoPlayer channelUrl={selectedChannel.streamURL} />
                </div>
              </>
            ) : (
              <div className="no-channel-message">
                <p>Sélectionnez une chaîne pour commencer</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Overlay de chargement */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default XtremeCodeLoader;
