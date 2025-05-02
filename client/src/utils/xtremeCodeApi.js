// src/utils/xtremeCodeApi.js
import axios from 'axios';
// Import the IndexedDB service
import { saveChannels, checkValidCache, clearIdbCache } from './indexedDbService';

// Cache validity duration (60 minutes in ms)
const CACHE_VALIDITY = 60 * 60 * 1000;

// France category IDs
export const FRANCE_CATEGORY_IDS = ['74', '73', '76', '77', '80', '83', '430'];

// This function is still useful for maintaining compatibility
export function clearCache() {
  // Clear localStorage as a precaution
  localStorage.removeItem('xtreme_channels');
  localStorage.removeItem('xtreme_server_info');
  localStorage.removeItem('xtreme_last_update');
  localStorage.removeItem('xtreme_credentials');
  
  // Clear IndexedDB
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

// Get only French channels
export async function getXtremeFrenchChannels(serverUrl, username, password) {
  try {
    if (!serverUrl || !username || !password) {
      throw new Error('Server URL, username and password are required');
    }
    
    // Check if we have valid cached data in IndexedDB specifically for French channels
    const cacheKey = `french_${serverUrl}_${username}`;
    const cachedData = await checkValidCache(cacheKey, username, password, CACHE_VALIDITY);
    if (cachedData && cachedData.length > 0) {
      console.log('Using cached French channels data from IndexedDB');
      return cachedData;
    }
    
    // If no valid cache, load data from the API
    console.log('No valid French channels cache, loading from API...');
    
    // Format the server URL
    const apiUrl = formatServerUrl(serverUrl);
    
    // Get authentication information
    const authResponse = await axios.get(`${apiUrl}/player_api.php`, {
      params: {
        username,
        password
      }
    });
    
    // Check if authentication succeeded
    if (!authResponse.data || authResponse.data.user_info?.auth === 0) {
      throw new Error('Authentication failed. Please check your credentials.');
    }
    
    // Get categories
    const categoriesResponse = await axios.get(`${apiUrl}/player_api.php`, {
      params: {
        username,
        password,
        action: 'get_live_categories'
      }
    });
    
    const allCategories = categoriesResponse.data;
    
    // Filter French categories
    const frenchCategories = allCategories.filter(cat => 
      FRANCE_CATEGORY_IDS.includes(cat.category_id.toString())
    );
    
    console.log(`Found ${frenchCategories.length} French categories out of ${allCategories.length} total`);
    
    // Get streams for French categories only
    const channels = [];
    
    for (const category of frenchCategories) {
      console.log(`Fetching streams for French category: ${category.category_name} (ID: ${category.category_id})`);
      
      const streamsResponse = await axios.get(`${apiUrl}/player_api.php`, {
        params: {
          username,
          password,
          action: 'get_live_streams',
          category_id: category.category_id
        }
      });
      
      const streams = streamsResponse.data;
      
      // Transform the data
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
      console.log(`Added ${transformedStreams.length} streams from French category ${category.category_name}`);
    }
    
    // Save data to IndexedDB with a special key for French channels
    try {
      await saveChannels(channels, cacheKey, username, password);
      console.log(`Successfully saved ${channels.length} French channels to IndexedDB`);
    } catch (error) {
      console.error('Failed to save French channels to IndexedDB:', error);
    }
    
    console.log(`Successfully loaded ${channels.length} French channels total`);
    return channels;
  } catch (error) {
    console.error('Error getting French live streams:', error);
    throw error;
  }
}

// Original function maintained for compatibility
export async function getXtremeLiveStreams(serverUrl, username, password, frenchOnly = false) {
  // If French only is requested, use the specialized function
  if (frenchOnly) {
    return getXtremeFrenchChannels(serverUrl, username, password);
  }
  
  try {
    if (!serverUrl || !username || !password) {
      throw new Error('Server URL, username and password are required');
    }
    
    // Check if we have valid cached data in IndexedDB
    const cachedData = await checkValidCache(serverUrl, username, password, CACHE_VALIDITY);
    if (cachedData && cachedData.length > 0) {
      console.log('Using cached data from IndexedDB');
      return cachedData;
    }
    
    // If no valid cache, load data from the API
    console.log('No valid cache found, loading from API...');
    
    // Format the server URL
    const apiUrl = formatServerUrl(serverUrl);
    
    // Get authentication information
    const authResponse = await axios.get(`${apiUrl}/player_api.php`, {
      params: {
        username,
        password
      }
    });
    
    // Check if authentication succeeded
    if (!authResponse.data || authResponse.data.user_info?.auth === 0) {
      throw new Error('Authentication failed. Please check your credentials.');
    }
    
    // Get categories
    const categoriesResponse = await axios.get(`${apiUrl}/player_api.php`, {
      params: {
        username,
        password,
        action: 'get_live_categories'
      }
    });
    
    const categories = categoriesResponse.data;
    console.log(`Found ${categories.length} categories, fetching streams...`);
    
    // Get all streams
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
      
      // Transform the data
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
    
    // Save data to IndexedDB
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
