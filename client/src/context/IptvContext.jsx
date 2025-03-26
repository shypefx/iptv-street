// src/context/IptvContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getXtremeLiveStreams, clearCache } from '../utils/xtremeCodeApi';

// Création du contexte
const IptvContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useIptv = () => useContext(IptvContext);

// Fournisseur du contexte
export const IptvProvider = ({ children }) => {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Essayer de charger les identifiants du stockage local au démarrage
  useEffect(() => {
    try {
      const cachedCredentials = localStorage.getItem('xtreme_credentials');
      if (cachedCredentials) {
        const { serverUrl: cachedServer, username: cachedUser, password: cachedPass } = JSON.parse(cachedCredentials);
        setServerUrl(cachedServer || '');
        setUsername(cachedUser || '');
        setPassword(cachedPass || '');
        
        // Auto-connexion si nous avons des identifiants en cache
        if (cachedServer && cachedUser && cachedPass) {
          loadChannels(cachedServer, cachedUser, cachedPass);
        }
      }
    } catch (error) {
      console.error('Error loading cached credentials:', error);
    }
  }, []);

  // Fonction pour charger les chaînes
  const loadChannels = async (server = serverUrl, user = username, pass = password) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading channels from API...');
      const channelsData = await getXtremeLiveStreams(server, user, pass);
      
      setChannels(channelsData);
      setIsAuthenticated(true);
      
      // Sélectionner la première chaîne si disponible et aucune n'est déjà sélectionnée
      if (channelsData.length > 0 && !selectedChannel) {
        setSelectedChannel(channelsData[0]);
      }
      
      console.log(`Successfully loaded ${channelsData.length} channels`);
    } catch (error) {
      setError(`Error loading channels: ${error.message}`);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour se connecter
  const login = async (server, user, pass) => {
    setServerUrl(server);
    setUsername(user);
    setPassword(pass);
    return loadChannels(server, user, pass);
  };

  // Fonction pour se déconnecter
  const logout = () => {
    setIsAuthenticated(false);
    setChannels([]);
    setSelectedChannel(null);
  };

  // Fonction pour vider le cache
  const handleClearCache = () => {
    clearCache();
    setChannels([]);
    setSelectedChannel(null);
    setIsAuthenticated(false);
  };

  // Valeurs fournies par le contexte
  const value = {
    // État
    serverUrl,
    username,
    password,
    channels,
    selectedChannel,
    loading,
    error,
    isAuthenticated,
    
    // Fonctions
    setServerUrl,
    setUsername,
    setPassword,
    setSelectedChannel,
    login,
    logout,
    loadChannels,
    handleClearCache
  };

  return (
    <IptvContext.Provider value={value}>
      {children}
    </IptvContext.Provider>
  );
};
