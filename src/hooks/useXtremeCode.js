import { useState } from 'react';
import { authenticateXtreme, getXtremeLiveStreams } from '../utils/xtremeCodeApi';

export function useXtremeCode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [channels, setChannels] = useState([]);

  const authenticate = async (serverUrl, username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await authenticateXtreme(serverUrl, username, password);
      setUserData(userData);
      setAuthenticated(true);
      return true;
    } catch (err) {
      setError('Authentication failed');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async (serverUrl, username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Authenticate first if not already done
      if (!authenticated) {
        await authenticate(serverUrl, username, password);
      }
      
      const liveStreams = await getXtremeLiveStreams(serverUrl, username, password);
      setChannels(liveStreams);
      return liveStreams;
    } catch (err) {
      setError('Failed to fetch channels');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthenticated(false);
    setUserData(null);
    setChannels([]);
  };

  return {
    loading,
    error,
    authenticated,
    userData,
    channels,
    authenticate,
    fetchChannels,
    logout
  };
}
