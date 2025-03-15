// src/utils/m3uParser.js - updated version
import { Parser } from 'm3u8-parser';

export const parseM3UContent = (content) => {
  const parser = new Parser();
  parser.push(content);
  parser.end();
  
  return parser.manifest.segments.map(segment => {
    // Extract channel info from attributes
    const channelInfo = segment.custom || {};
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: channelInfo['tvg-name'] || 'Unknown Channel',
      logo: channelInfo['tvg-logo'] || '',
      group: channelInfo['group-title'] || 'Uncategorized',
      url: segment.uri
    };
  });
};

export const loadM3UFromUrl = async (url) => {
  try {
    // Use a CORS proxy if this is a browser environment
    const corsProxyUrl = 'https://api.allorigins.win/raw?url=';
    
    // Try with proxy first
    try {
      const response = await fetch(`${corsProxyUrl}${encodeURIComponent(url)}`);
      const content = await response.text();
      return parseM3UContent(content);
    } catch (proxyError) {
      console.warn('CORS proxy failed, trying direct request:', proxyError);
      
      // If proxy fails, try direct request
      const directResponse = await fetch(url);
      const content = await directResponse.text();
      return parseM3UContent(content);
    }
  } catch (error) {
    console.error('Error loading M3U from URL:', error);
    throw error;
  }
};

export const loadM3UFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const channels = parseM3UContent(content);
        resolve(channels);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
