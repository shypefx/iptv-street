import { useState } from 'react';
import { loadM3UFromUrl, loadM3UFromFile } from '../utils/m3uParser';

export function useM3UParser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [channels, setChannels] = useState([]);

  const parseFromUrl = async (url) => {
    setLoading(true);
    setError(null);
    
    try {
      const parsedChannels = await loadM3UFromUrl(url);
      setChannels(parsedChannels);
      return parsedChannels;
    } catch (err) {
      setError('Failed to load or parse M3U from URL');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const parseFromFile = async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      const parsedChannels = await loadM3UFromFile(file);
      setChannels(parsedChannels);
      return parsedChannels;
    } catch (err) {
      setError('Failed to parse M3U file');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    channels,
    parseFromUrl,
    parseFromFile
  };
}
