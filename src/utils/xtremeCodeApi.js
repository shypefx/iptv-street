// src/utils/xtremeCodeApi.js - Enhanced for token handling
import axios from 'axios';

export const authenticateXtreme = async (serverUrl, username, password) => {
  try {
    // Ensure the URL is properly formatted
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

export const getXtremeLiveStreams = async (serverUrl, username, password) => {
  try {
    // Ensure the URL is properly formatted
    const baseUrl = formatServerUrl(serverUrl);
    
    const response = await axios.get(`${baseUrl}/player_api.php`, {
      params: {
        username,
        password,
        action: 'get_live_streams'
      }
    });
    
    return response.data.map(channel => {
      // Add a timestamp to avoid caching issues with tokens
      const timestamp = Date.now();
      // Create the proper stream URL with token
      const streamUrl = `${baseUrl}/live/${username}/${password}/${channel.stream_id}.ts?_=${timestamp}`;
      
      return {
        id: channel.stream_id,
        name: channel.name,
        logo: channel.stream_icon,
        group: channel.category_name || 'Uncategorized',
        url: streamUrl
      };
    });
  } catch (error) {
    console.error('Error getting live streams:', error);
    throw error;
  }
};

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
