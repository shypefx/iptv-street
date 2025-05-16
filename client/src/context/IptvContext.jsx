// src/context/IptvContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

// France category IDs from your list
const FRANCE_CATEGORY_IDS = ['74', '73', '76', '77', '80', '83', '430'];

const IptvContext = createContext();

export const useIptv = () => useContext(IptvContext);

export const IptvProvider = ({ children }) => {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOnlyFranceChannels, setShowOnlyFranceChannels] = useState(true);
  const [targetCategoryIds, setTargetCategoryIds] = useState(FRANCE_CATEGORY_IDS);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Get auth context
  const auth = useContext(AuthContext);
  
  // Check for cached channels on load
  useEffect(() => {
    const loadInitialData = async () => {
      // If user is authenticated, check if channel data exists on server
      if (auth.currentUser && serverUrl && username) {
        try {
          const { exists, needsRefresh } = await checkChannelsExistOnServer(serverUrl, username);
          
          if (exists && !needsRefresh) {
            // Load channels from server
            await loadChannelsFromServer(serverUrl, username);
            return;
          }
        } catch (err) {
          console.error('Failed to check server channel status:', err);
          // Continue to local storage fallback
        }
      }
      
      // Fallback to localStorage if server data isn't available
      const cachedData = localStorage.getItem('cached_channels');
      const cachedTimestamp = localStorage.getItem('cached_channels_timestamp');
      
      if (cachedData && cachedTimestamp) {
        try {
          const parsedData = JSON.parse(cachedData);
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          
          // Check if cache is less than 12 hours old (43200000 ms)
          if (now - timestamp < 43200000) {
            console.log('Loading channels from local cache...');
            setChannels(parsedData);
            setLastUpdated(new Date(timestamp).toLocaleString());
            
            // Extract categories from cached data
            const uniqueCategories = [...new Set(parsedData
              .map(ch => ch.category_name)
              .filter(Boolean))]
              .sort()
              .map((name, index) => ({
                category_id: index.toString(),
                category_name: name
              }));
            
            setCategories(uniqueCategories);
            
            // Check for credentials
            const savedCredentials = localStorage.getItem('xtreme_credentials');
            if (savedCredentials) {
              const { serverUrl, username, password } = JSON.parse(savedCredentials);
              setServerUrl(serverUrl);
              setUsername(username); 
              setPassword(password);
              setIsAuthenticated(true);
            }
            
            console.log(`Loaded ${parsedData.length} channels from cache`);
            return;
          } else {
            console.log('Cache is too old, will reload data when needed');
          }
        } catch (err) {
          console.error('Failed to load cached data:', err);
        }
      }
      
      // If we got here, check if we have credentials to auto-load
      const savedCredentials = localStorage.getItem('xtreme_credentials');
      if (savedCredentials) {
        const { serverUrl, username, password } = JSON.parse(savedCredentials);
        setServerUrl(serverUrl);
        setUsername(username);
        setPassword(password);
      }
    };
    
    loadInitialData();
  }, [auth.currentUser]);
  
  // Function to check if channels exist on server
  const checkChannelsExistOnServer = async (serverUrl, username) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { exists: false };
      
      const response = await axios.get(`http://localhost:5001/api/iptv/channels/check`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { serverUrl, username }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error checking channels on server:', error);
      return { exists: false };
    }
  };
  
  // Function to load channels from server
  const loadChannelsFromServer = async (serverUrl, username) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await axios.get(`http://localhost:5001/api/iptv/channels`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { serverUrl, username }
      });
      
      const { channels: serverChannels, categories: serverCategories, lastUpdated } = response.data;
      
      setChannels(serverChannels);
      setCategories(serverCategories || []);
      setLastUpdated(new Date(lastUpdated).toLocaleString());
      setIsAuthenticated(true);
      
      console.log(`Loaded ${serverChannels.length} channels from server`);
      
      if (serverChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(serverChannels[0]);
      }
      
      return true;
    } catch (error) {
      console.error('Error loading channels from server:', error);
      return false;
    }
  };
  
  // Function to save channels to server
  const saveChannelsToServer = async (channelsData, categoriesData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const payload = {
        serverUrl,
        username,
        channels: channelsData,
        categories: categoriesData
      };
      
      await axios.post(`http://localhost:5001/api/iptv/channels`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Channels saved to server successfully');
      return true;
    } catch (error) {
      console.error('Error saving channels to server:', error);
      return false;
    }
  };
  
  // Function to fetch only French categories
  const fetchFrenchChannels = async (serverUrl, username, password) => {
    try {
      const allChannels = [];
      const allCategories = [];
      
      setLoading(true);
      console.log(`Fetching channels from ${FRANCE_CATEGORY_IDS.length} French categories...`);
      
      // First get all categories to have the category names
      const categoriesUrl = `${serverUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
      const categoriesResponse = await axios.get(categoriesUrl);
      const categoriesData = categoriesResponse.data;
      
      console.log(`Loaded ${categoriesData.length} categories`);
      
      // Filter relevant categories (French)
      const frenchCategories = categoriesData.filter(cat => 
        FRANCE_CATEGORY_IDS.includes(cat.category_id.toString())
      );
      
      console.log(`Found ${frenchCategories.length} French categories`);
      allCategories.push(...frenchCategories);
      
      // Get channels for each French category
      for (const category of frenchCategories) {
        const categoryId = category.category_id;
        console.log(`Fetching channels for category ${category.category_name} (ID: ${categoryId})`);
        
        const channelsUrl = `${serverUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams&category_id=${categoryId}`;
        const channelsResponse = await axios.get(channelsUrl);
        const categoryChannels = channelsResponse.data;
        
        // Process and format channels
        const formattedChannels = categoryChannels.map(channel => ({
          id: channel.stream_id.toString(),
          name: channel.name,
          category_id: channel.category_id.toString(),
          category_name: category.category_name,
          stream_type: channel.stream_type,
          stream_url: `${serverUrl}/live/${username}/${password}/${channel.stream_id}.ts`,
          stream_icon: channel.stream_icon || '',
          epg_channel_id: channel.epg_channel_id || null
        }));
        
        allChannels.push(...formattedChannels);
        console.log(`Added ${formattedChannels.length} channels from ${category.category_name}`);
      }
      
      console.log(`Total channels fetched: ${allChannels.length}`);
      setLoading(false);
      
      return [allChannels, allCategories];
    } catch (error) {
      setLoading(false);
      console.error('Error fetching French channels:', error);
      throw error;
    }
  };
  
  // Validate credentials
  const validateXtreamCredentials = async (server, user, pass) => {
    try {
      const url = `${server}/player_api.php?username=${user}&password=${pass}`;
      const response = await fetch(url);
      const data = await response.json();
      return data && !data.error;
    } catch (error) {
      console.error('Credential validation error:', error);
      return false;
    }
  };
  
  // Login function (optimized for French channels only)
  const login = async (serverUrlInput, usernameInput, passwordInput) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate credentials
      const xtreamSuccess = await validateXtreamCredentials(serverUrlInput, usernameInput, passwordInput);
      
      if (!xtreamSuccess) {
        setError('Invalid IPTV credentials. Please check your information.');
        setLoading(false);
        return false;
      }
      
      // Set credentials in state
      setServerUrl(serverUrlInput);
      setUsername(usernameInput);
      setPassword(passwordInput);
      
      // Save credentials (for auto-login)
      localStorage.setItem('xtreme_credentials', JSON.stringify({ 
        serverUrl: serverUrlInput, 
        username: usernameInput, 
        password: passwordInput 
      }));
      
      try {
        // Load only French channels
        const [frenchChannels, frenchCategories] = await fetchFrenchChannels(
          serverUrlInput, 
          usernameInput, 
          passwordInput
        );
        
        // Update state with fetched data
        setChannels(frenchChannels);
        setCategories(frenchCategories);
        setLastUpdated(new Date().toLocaleString());
        setIsAuthenticated(true);
        
        // If we have channels, select the first one
        if (frenchChannels.length > 0) {
          setSelectedChannel(frenchChannels[0]);
        }
        
        // Try to save to localStorage
        try {
          localStorage.setItem('cached_channels', JSON.stringify(frenchChannels));
          localStorage.setItem('cached_categories', JSON.stringify(frenchCategories));
          localStorage.setItem('cached_channels_timestamp', Date.now().toString());
          console.log(`Cached ${frenchChannels.length} French channels in localStorage`);
        } catch (storageError) {
          console.warn('Failed to save channels to localStorage (quota exceeded)', storageError);
          // Continue anyway - we'll use the server storage
        }
        
        // Save to server if user is logged in
        if (auth.currentUser) {
          await saveChannelsToServer(frenchChannels, frenchCategories);
        }
        
        setLoading(false);
        return true;
      } catch (loadError) {
        console.error('Error loading French channels:', loadError);
        setError('Failed to load channels. Please try again.');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Failed to connect to IPTV service. Please check your credentials.');
      setLoading(false);
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    setIsAuthenticated(false);
    setSelectedChannel(null);
    // Do not clear credentials to allow quick reconnection
  };
  
  // Function to clear the cache
  const handleClearCache = () => {
    localStorage.removeItem('cached_channels');
    localStorage.removeItem('cached_categories');
    localStorage.removeItem('cached_channels_timestamp');
    
    // Optionally clear from server too
    if (auth.currentUser && serverUrl && username) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          axios.delete(`http://localhost:5001/api/iptv/channels`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { serverUrl, username }
          });
        }
      } catch (error) {
        console.error('Error deleting server cache:', error);
      }
    }
    
    // Reload fresh data
    if (isAuthenticated) {
      login(serverUrl, username, password);
    }
  };
  
  // Get channel by ID
  const getChannelById = useCallback((id) => {
    return channels.find(channel => channel.id === id) || null;
  }, [channels]);
  
  // Set channel for playback
  const playChannel = (channelId) => {
    const channel = getChannelById(channelId);
    if (channel) {
      console.log(`Playing channel: ${channel.name}`);
      setSelectedChannel(channel);
    }
  };
  
  // Toggle French channels filter
  const toggleFranceFilter = () => {
    setShowOnlyFranceChannels(!showOnlyFranceChannels);
  };
  
  // Get filtered channels
  const filteredChannels = useMemo(() => {
    if (!showOnlyFranceChannels) return channels;
    return channels.filter(channel => 
      channel.category_id && 
      targetCategoryIds.includes(channel.category_id.toString())
    );
  }, [channels, showOnlyFranceChannels, targetCategoryIds]);
  
  // Provide context value
  const contextValue = {
    serverUrl,
    username,
    password,
    isAuthenticated,
    channels,
    filteredChannels,
    categories,
    selectedChannel,
    loading,
    error,
    showOnlyFranceChannels,
    lastUpdated,
    login,
    logout,
    playChannel,
    handleClearCache,
    toggleFranceFilter,
    getChannelById,
    targetCategoryIds,
    setTargetCategoryIds,
    FRANCE_CATEGORY_IDS
  };
  
  return (
    <IptvContext.Provider value={contextValue}>
      {children}
    </IptvContext.Provider>
  );
};

export default IptvContext;
