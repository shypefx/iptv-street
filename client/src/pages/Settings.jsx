// Exemple d'utilisation dans un autre composant, comme Settings.jsx
import React from 'react';
import { useIptv } from '../context/IptvContext';
import '../styles/Settings.css';

const Settings = () => {
  const { channels, isAuthenticated, serverUrl, username, handleClearCache } = useIptv();
  
  return (
    <div className="settings-page">
      <h1>Paramètres</h1>
      
      {isAuthenticated ? (
        <div className="settings-authenticated">
          <div className="settings-section">
            <h2>Informations du serveur</h2>
            <p><strong>URL du serveur:</strong> {serverUrl}</p>
            <p><strong>Utilisateur:</strong> {username}</p>
            <p><strong>Chaînes chargées:</strong> {channels.length}</p>
          </div>
          
          <div className="settings-section">
            <h2>Gestion du cache</h2>
            <button onClick={handleClearCache} className="clear-cache-button">
              Vider le cache
            </button>
            <p className="description">
              Le cache permet de réduire le temps de chargement en stockant localement les données des chaînes.
            </p>
          </div>
        </div>
      ) : (
        <div className="not-authenticated">
          <p>Vous n'êtes pas connecté à un serveur IPTV.</p>
          <p>Veuillez vous connecter depuis la page d'accueil pour accéder aux paramètres.</p>
        </div>
      )}
    </div>
  );
};

export default Settings;
