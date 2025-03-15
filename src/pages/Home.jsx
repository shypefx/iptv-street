// src/pages/Home.jsx - updated version
import { useState } from 'react';
import { useIPTV } from '../contexts/IPTVContext';
import ChannelList from '../components/ChannelList';
import M3ULoader from '../components/M3ULoader';
import XtremeCodeLoader from '../components/XtremeCodeLoader';

export default function Home() {
  const { channels } = useIPTV();
  const [activeTab, setActiveTab] = useState('channels');
  
  return (
    <div className="home-page">
      <h1>IPTV Player</h1>
      
      {channels.length === 0 ? (
        <div className="onboarding-tabs">
          <div className="tabs">
            <button 
              className={activeTab === 'm3u' ? 'active' : ''} 
              onClick={() => setActiveTab('m3u')}
            >
              Load M3U Playlist
            </button>
            <button 
              className={activeTab === 'xtreme' ? 'active' : ''} 
              onClick={() => setActiveTab('xtreme')}
            >
              Xtreme Code Login
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'm3u' && <M3ULoader />}
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
            {activeTab === 'channels' && <ChannelList />}
            {activeTab === 'add' && (
              <div className="add-more">
                <div className="tabs sub-tabs">
                  <button 
                    className={activeTab === 'add-m3u' ? 'active' : ''} 
                    onClick={() => setActiveTab('add-m3u')}
                  >
                    M3U Playlist
                  </button>
                  <button 
                    className={activeTab === 'add-xtreme' ? 'active' : ''} 
                    onClick={() => setActiveTab('add-xtreme')}
                  >
                    Xtreme Code
                  </button>
                </div>
                
                <div className="tab-content">
                  {activeTab === 'add-m3u' && <M3ULoader />}
                  {activeTab === 'add-xtreme' && <XtremeCodeLoader />}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
