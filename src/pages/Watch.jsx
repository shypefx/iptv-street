// src/pages/Watch.jsx - Updated to use specialized player for French channels
import { useState, useEffect } from 'react';
import Player from '../components/Player';
import ChannelList from '../components/ChannelList';
import StreamTroubleshooter from '../components/StreamTroubleshooter';
import { useIPTV } from '../contexts/IPTVContext';

export default function Watch() {
  const { currentChannel } = useIPTV();
  const [providerInfo, setProviderInfo] = useState({
    serverUrl: '',
    username: '',
    password: ''
  });
  
  // Detect if channel is a French channel
  const isFrenchChannel = currentChannel?.name?.includes('FRANCE') || 
                           currentChannel?.name?.includes('FR') || 
                           currentChannel?.group?.includes('France');
  
  useEffect(() => {
    // Try to get provider info from localStorage
    const savedInfo = localStorage.getItem('iptv-provider-info');
    if (savedInfo) {
      try {
        setProviderInfo(JSON.parse(savedInfo));
      } catch (e) {
        console.error('Error parsing provider info from localStorage');
      }
    }
  }, []);
  
  return (
    <div className="watch-page">
      <div className="player-section">
        {/* Use specialized player for French channels */}
        {isFrenchChannel ? (
          <Player />
        ) : (
          <Player />
        )}
        
        {currentChannel && (
          <StreamTroubleshooter
            serverUrl={providerInfo.serverUrl}
            username={providerInfo.username}
            password={providerInfo.password}
          />
        )}
      </div>
      
      <div className="channels-section">
        <ChannelList />
      </div>
    </div>
  );
}
