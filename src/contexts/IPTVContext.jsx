// src/contexts/IPTVContext.jsx (enhanced version)
import { createContext, useState, useEffect, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const IPTVContext = createContext();

export const IPTVProvider = ({ children }) => {
  const [channels, setChannels] = useLocalStorage('iptv-channels', []);
  const [currentChannel, setCurrentChannel] = useLocalStorage('iptv-current-channel', null);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  
  useEffect(() => {
    // Extract unique groups from channels
    if (channels.length) {
      const uniqueGroups = [...new Set(channels.map(channel => channel.group))];
        setGroups(uniqueGroups);
        console.log('Groups:', uniqueGroups);
    } else {
      setGroups([]);
    }
  }, [channels]);
  
  const addChannels = (newChannels) => {
    setChannels(prevChannels => {
      // Create a Map with existing channels to detect duplicates
      const channelMap = new Map(
        prevChannels.map(channel => [channel.url, channel])
      );
      
      // Add new channels if they don't exist
      newChannels.forEach(channel => {
        if (!channelMap.has(channel.url)) {
          channelMap.set(channel.url, channel);
        }
      });
      
      return Array.from(channelMap.values());
    });
  };
  
  const clearChannels = () => {
    setChannels([]);
    setCurrentChannel(null);
  };
  
  return (
    <IPTVContext.Provider value={{
      channels,
      setChannels,
      addChannels,
      clearChannels,
      currentChannel,
      setCurrentChannel,
      loading,
      setLoading,
      groups
    }}>
      {children}
    </IPTVContext.Provider>
  );
};

export const useIPTV = () => useContext(IPTVContext);
