// src/pages/Home.jsx - version corrigée
import { useState } from 'react';
import { useIptv } from '../context/IptvContext.jsx';
import ChannelList from '../components/ChannelList';
import XtremeCodeLoader from '../components/XtremeCodeLoader';
import '../styles/Home.css'

export default function Home() {
  const { channels } = useIptv();
  const [activeTab, setActiveTab] = useState('channels');
  // Ajouter cette ligne pour gérer le canal sélectionné localement
  const [selectedChannel, setSelectedChannel] = useState(null);
  
  return (
    <div className="home-page">
      <h1>IPTV Player</h1>
      
      {channels.length === 0 ? (
        <div className="onboarding-tabs">
          <div className="tabs">
            <button 
              className={activeTab === 'xtreme' ? 'active' : ''} 
              onClick={() => setActiveTab('xtreme')}
            >
              Xtreme Code Login
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'xtreme' && <XtremeCodeLoader />}
          </div>
        </div>
      ) : (
        <div className="channel-browser">
          <div className="tabs">
            <button 
              className={activeTab === 'channels' ? 'active' : ''} 
              onClick={() => setActiveTab('channels')}
            >
              My Channels
            </button>
            <button 
              className={activeTab === 'add' ? 'active' : ''} 
              onClick={() => setActiveTab('add')}
            >
              Add More Channels
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'channels' &&           
            <ChannelList 
              channels={channels || []} 
              onChannelSelect={setSelectedChannel} 
              selectedChannel={selectedChannel}
            />}
            {activeTab === 'add' && (
              <div className="add-more">
                <div className="tabs sub-tabs">
                  <button 
                    className={activeTab === 'add-xtreme' ? 'active' : ''} 
                    onClick={() => setActiveTab('add-xtreme')}
                  >
                    Xtreme Code
                  </button>
                </div>
                
                <div className="tab-content">
                  {activeTab === 'add-xtreme' && <XtremeCodeLoader />}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Ajoutez cette section pour afficher la chaîne sélectionnée si nécessaire */}
      {selectedChannel && (
        <div className="selected-channel-viewer">
          <h3>{selectedChannel.name}</h3>
          {/* Intégrez ici votre lecteur vidéo ou tout autre composant d'affichage */}
        </div>
      )}
    </div>
  );
}
