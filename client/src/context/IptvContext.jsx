// src/context/IptvContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getXtremeLiveStreams, clearCache } from '../utils/xtremeCodeApi';

// Création du contexte
const IptvContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useIptv = () => {
  const context = useContext(IptvContext);
  if (!context) {
    throw new Error('useIptv doit être utilisé à l\'intérieur d\'un IptvProvider');
  }
  return context;
};

// Fournisseur du contexte
export const IptvProvider = ({ children }) => {
  // États pour gestion de l'authentification
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // États pour gestion des données
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // État pour l'historique
  const [lastViewedChannels, setLastViewedChannels] = useState(() => {
    return JSON.parse(localStorage.getItem('lastViewedChannels') || '[]');
  });

  // Nouveaux états pour les filtres
  const [countries, setCountries] = useState([]);
  const [channelTypes, setChannelTypes] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedQuality, setSelectedQuality] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

      // Charger les filtres précédemment utilisés s'ils existent
      const savedFilters = localStorage.getItem('iptv_filters');
      if (savedFilters) {
        const { country, type, quality, search } = JSON.parse(savedFilters);
        if (country) setSelectedCountry(country);
        if (type) setSelectedType(type);
        if (quality) setSelectedQuality(quality);
        if (search) setSearchQuery(search);
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  }, []);

  // Sauvegarder les filtres quand ils changent
  useEffect(() => {
    localStorage.setItem('iptv_filters', JSON.stringify({
      country: selectedCountry,
      type: selectedType,
      quality: selectedQuality,
      search: searchQuery
    }));
  }, [selectedCountry, selectedType, selectedQuality, searchQuery]);

  // Fonction pour normaliser la structure des chaînes
  const normalizeChannelStructure = (channels) => {
    if (!channels || !Array.isArray(channels)) {
      console.error("Données de chaînes non valides:", channels);
      return [];
    }
    
    return channels.map(channel => {
      // Assurer que stream_id existe pour la compatibilité
      const streamId = channel.id?.toString();
      
      return {
        // Conserver toutes les propriétés originales
        ...channel,
        // Ajouter stream_id pour la compatibilité avec le code existant
        stream_id: streamId,
        // Normaliser les URLs
        stream_url: channel.streamURL || channel.stream_url || '',
        stream_icon: channel.logoURL || channel.stream_icon || '',
        // Normaliser les noms de catégories
        category_name: channel.category || channel.category_name || 'Autre'
      };
    });
  };

  // Fonction pour extraire les métadonnées des chaînes
  const extractMetadata = (channelsData) => {
    console.log("Extraction des métadonnées pour", channelsData.length, "chaînes");
    const countriesSet = new Set();
    const typesSet = new Set();
    const qualitiesSet = new Set();
    
    const processedChannels = channelsData.map(channel => {
      // Extraire le pays du nom de la chaîne (ex: "AR| BEIN SPORTS")
      let country = channel.country || 'Inconnu';
      
      // Si le pays n'est pas défini, essayer de l'extraire du nom de la chaîne
      if (country === 'Inconnu' && channel.name) {
        const countryMatch = channel.name.match(/^(?:[^|]*\|)?\s*([A-Z]{2})[|\s-]/);
        if (countryMatch) {
          country = countryMatch[1];
        }
      }
      
      // Utiliser le type de chaîne existant ou déterminer depuis la catégorie
      let type = channel.channelType || 'Autre';
      
      if (!channel.channelType && channel.category) {
        // Détection simple des types courants
        if (channel.category.toLowerCase().includes('sport')) {
          type = 'Sports';
        } else if (channel.category.toLowerCase().includes('news')) {
          type = 'News';
        } else if (channel.category.toLowerCase().includes('movie') || 
                  channel.category.toLowerCase().includes('film') ||
                  channel.category.toLowerCase().includes('cinema')) {
          type = 'Movies';
        } else if (channel.category.toLowerCase().includes('kid') || 
                  channel.category.toLowerCase().includes('enfant')) {
          type = 'Kids';
        } else if (channel.category.toLowerCase().includes('music') || 
                  channel.category.toLowerCase().includes('musique')) {
          type = 'Music';
        }
      }
      
      // Utiliser la qualité existante ou extraire du nom
      let quality = channel.quality || 'SD';
      
      // Si la qualité n'est pas définie, essayer de l'extraire du nom
      if (!channel.quality && channel.name) {
        if (channel.name.includes('4K') || channel.name.includes('UHD')) {
          quality = '4K';
        } else if (channel.name.includes('FHD') || channel.name.includes('1080')) {
          quality = 'FHD';
        } else if (channel.name.includes('HD') || channel.name.includes('720')) {
          quality = 'HD';
        }
      }
      
      // Ajouter aux ensembles pour les filtres
      countriesSet.add(country);
      typesSet.add(type);
      qualitiesSet.add(quality);
      
      // Retourner la chaîne avec métadonnées supplémentaires/actualisées
      return {
        ...channel,
        country,
        channelType: type,
        quality
      };
    });
    
    // Convertir les ensembles en tableaux triés
    setCountries(Array.from(countriesSet).sort());
    setChannelTypes(Array.from(typesSet).sort());
    setQualities(Array.from(qualitiesSet).sort());
    
    // Extraire et définir les catégories uniques
    const uniqueCategories = [...new Set(processedChannels
      .map(ch => ch.category || ch.category_name)
      .filter(Boolean))]
      .sort()
      .map((name, index) => ({
        category_id: index.toString(),
        category_name: name
      }));
    
    setCategories(uniqueCategories);
    console.log("Métadonnées extraites:", uniqueCategories.length, "catégories et", processedChannels.length, "chaînes");
    
    return processedChannels;
  };

  // Fonction pour mettre à jour les dernières chaînes visionnées
  const updateLastViewedChannels = (channel) => {
    if (!channel) return;
    
    // Utiliser id ou stream_id comme identifiant unique
    const channelId = channel.id?.toString() || channel.stream_id?.toString();
    
    if (!channelId) {
      console.error("Impossible de mettre à jour l'historique: chaîne sans ID", channel);
      return;
    }
    
    const updatedHistory = [
      channel, 
      ...lastViewedChannels.filter(c => 
        (c.id?.toString() !== channelId) && 
        (c.stream_id?.toString() !== channelId)
      )
    ].slice(0, 10);
    
    setLastViewedChannels(updatedHistory);
    localStorage.setItem('lastViewedChannels', JSON.stringify(updatedHistory));
  };

  // Fonction pour charger les chaînes
  const loadChannels = async (server = serverUrl, user = username, pass = password) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading channels from API...');
      const channelsData = await getXtremeLiveStreams(server, user, pass);
      
      // Normaliser la structure des chaînes d'abord
      const normalizedChannels = normalizeChannelStructure(channelsData);
      
      // Extraire les métadonnées pour les filtres
      const processedChannels = extractMetadata(normalizedChannels);
      
      // Sauvegarder les informations d'authentification
      localStorage.setItem('xtreme_credentials', JSON.stringify({ 
        serverUrl: server, 
        username: user, 
        password: pass 
      }));
      
      setChannels(processedChannels);
      setIsAuthenticated(true);
      
      // Sélectionner la première chaîne si disponible et aucune n'est déjà sélectionnée
      if (processedChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(processedChannels[0]);
      }
      
      console.log(`Successfully loaded ${processedChannels.length} channels with ${categories.length} categories`);
    } catch (error) {
      console.error('Error during channel loading:', error);
      setError(`Error loading channels: ${error.message}`);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir une chaîne par ID
  const getChannelById = useCallback((channelId) => {
    if (!channelId || !channels.length) {
      return null;
    }
    
    const idStr = channelId.toString();
    
    // Rechercher la chaîne par id ou stream_id
    return channels.find(channel => 
      (channel.id?.toString() === idStr) || 
      (channel.stream_id?.toString() === idStr)
    );
  }, [channels]);

  // Chaînes filtrées
  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const countryMatch = selectedCountry === 'all' || channel.country === selectedCountry;
      const typeMatch = selectedType === 'all' || channel.channelType === selectedType;
      const qualityMatch = selectedQuality === 'all' || channel.quality === selectedQuality;
      
      // Recherche textuelle si une requête est fournie
      const searchMatch = !searchQuery || 
        channel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (channel.category_name && channel.category_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (channel.category && channel.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return countryMatch && typeMatch && qualityMatch && searchMatch;
    });
  }, [channels, selectedCountry, selectedType, selectedQuality, searchQuery]);

  const login = async (server, user, pass) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validation des entrées
      if (!server || !user || !pass) {
        throw new Error('Tous les champs sont obligatoires');
      }
      
      // Mettre à jour les états
      setServerUrl(server);
      setUsername(user);
      setPassword(pass);
      
      // Charger les chaînes
      await loadChannels(server, user, pass);
      
      return true;
    } catch (err) {
      setError(err.message || "Erreur de connexion");
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    setIsAuthenticated(false);
    setSelectedChannel(null);
    setChannels([]);
    localStorage.removeItem('xtreme_credentials');
  };
  
  const handleClearCache = () => {
    clearCache();
    setChannels([]);
    setSelectedChannel(null);
    setIsAuthenticated(false);
    setSelectedCountry('all');
    setSelectedType('all');
    setSelectedQuality('all');
    setSearchQuery('');
    localStorage.removeItem('lastViewedChannels');
    localStorage.removeItem('xtreme_credentials');
    localStorage.removeItem('iptv_filters');
  };

  const resetFilters = () => {
    setSelectedCountry('all');
    setSelectedType('all');
    setSelectedQuality('all');
    setSearchQuery('');
  };

  const contextValue = {
    // États d'authentification
    serverUrl,
    username,
    password,
    isAuthenticated,
    
    // États de données
    channels,
    selectedChannel,
    categories,
    loading,
    error,
    lastViewedChannels,
    
    // États de filtrage
    countries,
    channelTypes,
    qualities,
    selectedCountry,
    selectedType,
    selectedQuality,
    searchQuery,
    filteredChannels,
    
    // Fonctions d'authentification
    setServerUrl,
    setUsername,
    setPassword,
    login,
    logout,
    getChannelById,
    
    // Fonctions de gestion des données
    setSelectedChannel,
    loadChannels,
    handleClearCache,
    updateLastViewedChannels,
    
    // Fonctions de filtrage
    setSelectedCountry,
    setSelectedType,
    setSelectedQuality,
    setSearchQuery,
    resetFilters
  };

  return (
    <IptvContext.Provider value={contextValue}>
      {children}
    </IptvContext.Provider>
  );
};
