// src/utils/xtremeCodeApi.js
import axios from 'axios';
// Importer le service IndexedDB
import { saveChannels, checkValidCache, clearIdbCache } from './indexedDbService';

// Durée de validité du cache (60 minutes en ms)
const CACHE_VALIDITY = 60 * 60 * 1000;

// Cette fonction est encore utile pour maintenir la compatibilité
export function clearCache() {
  // Vider le localStorage par précaution
  localStorage.removeItem('xtreme_channels');
  localStorage.removeItem('xtreme_server_info');
  localStorage.removeItem('xtreme_last_update');
  localStorage.removeItem('xtreme_credentials');
  
  // Vider IndexedDB
  clearIdbCache().catch(error => console.error('Error clearing IndexedDB:', error));
  
  console.log('Cache cleared');
}

export const authenticateXtreme = async (serverUrl, username, password) => {
  try {
    const baseUrl = formatServerUrl(serverUrl);
    
    const response = await axios.get(`${baseUrl}/player_api.php`, {
      params: {
        username,
        password
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

export async function getXtremeLiveStreams(serverUrl, username, password) {
  try {
    if (!serverUrl || !username || !password) {
      throw new Error('Server URL, username and password are required');
    }
    
    // Vérifier si nous avons des données en cache valides dans IndexedDB
    const cachedData = await checkValidCache(serverUrl, username, password, CACHE_VALIDITY);
    if (cachedData && cachedData.length > 0) {
      console.log('Using cached data from IndexedDB');
      return cachedData;
    }
    
    // Si pas de cache valide, charger les données depuis l'API
    console.log('No valid cache found, loading from API...');
    
    // Formater l'URL du serveur
    const apiUrl = formatServerUrl(serverUrl);
    
    // Récupérer les informations d'authentification
    const authResponse = await axios.get(`${apiUrl}/player_api.php`, {
      params: {
        username,
        password
      }
    });
    
    // Vérifier si l'authentification a réussi
    if (!authResponse.data || authResponse.data.user_info?.auth === 0) {
      throw new Error('Authentication failed. Please check your credentials.');
    }
    
    // Récupérer les catégories
    const categoriesResponse = await axios.get(`${apiUrl}/player_api.php`, {
      params: {
        username,
        password,
        action: 'get_live_categories'
      }
    });
    
    const categories = categoriesResponse.data;
    console.log(`Found ${categories.length} categories, fetching streams...`);
    
    // Récupérer tous les streams
    const channels = [];
    
    for (const category of categories) {
      console.log(`Fetching streams for category: ${category.category_name}`);
      
      const streamsResponse = await axios.get(`${apiUrl}/player_api.php`, {
        params: {
          username,
          password,
          action: 'get_live_streams',
          category_id: category.category_id
        }
      });
      
      const streams = streamsResponse.data;
      
      // Transformer les données
      const transformedStreams = streams.map(stream => ({
        id: stream.stream_id,
        name: stream.name,
        streamURL: `${apiUrl}/live/${username}/${password}/${stream.stream_id}.ts`,
        logoURL: stream.stream_icon || '',
        epgChannelId: stream.epg_channel_id || '',
        category: category.category_name,
        categoryId: category.category_id,
        source: 'xtream'
      }));
      
      channels.push(...transformedStreams);
      console.log(`Added ${transformedStreams.length} streams from category ${category.category_name}`);
    }
    
    // Sauvegarder les données dans IndexedDB
    try {
      await saveChannels(channels, serverUrl, username, password);
      console.log(`Successfully saved ${channels.length} channels to IndexedDB`);
    } catch (error) {
      console.error('Failed to save channels to IndexedDB:', error);
    }
    
    console.log(`Successfully loaded ${channels.length} channels total`);
    return channels;
  } catch (error) {
    console.error('Error getting live streams:', error);
    throw error;
  }
}

// Helper function to standardize the server URL format
const formatServerUrl = (url) => {
  let formattedUrl = url.trim();
  
  // Add http:// if no protocol specified
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'http://' + formattedUrl;
  }
  
  // Remove trailing slash if present
  if (formattedUrl.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, -1);
  }
  
  return formattedUrl;
};

// Function to get alternative stream formats
export const getAlternativeStreamUrl = (serverUrl, username, password, streamId) => {
  const baseUrl = formatServerUrl(serverUrl);
  const timestamp = Date.now();
  
  return [
    // Standard format .ts with token
    `${baseUrl}/live/${username}/${password}/${streamId}.ts?_=${timestamp}`,
    // Common alternative format .m3u8
    `${baseUrl}/live/${username}/${password}/${streamId}.m3u8?_=${timestamp}`,
    // Using /play/ path which some providers use
    `${baseUrl}/play/${username}/${password}/${streamId}.ts?_=${timestamp}`,
    // Direct path with token
    `${baseUrl}/${username}/${password}/${streamId}.ts?_=${timestamp}`,
    // Static URL format that some providers use
    `${baseUrl}/streaming/clients_live.php?username=${username}&password=${password}&stream=${streamId}&_=${timestamp}`
  ];
};
