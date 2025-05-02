// src/pages/Watch.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIptv } from '../context/IptvContext';
import VideoPlayer from '../components/VideoPlayer';
import { IoArrowBack, IoSearchOutline, IoFilterOutline, IoChevronDown } from 'react-icons/io5';
import { RiLiveLine } from 'react-icons/ri';
import '../styles/Watch.css';

// Helper function to handle last viewed channels locally
const updateLastViewedChannelsLocally = (channel) => {
  try {
    // Get existing last viewed channels from localStorage
    const lastViewedJSON = localStorage.getItem('lastViewedChannels');
    let lastViewed = lastViewedJSON ? JSON.parse(lastViewedJSON) : [];
    
    // Remove the channel if it already exists in the array
    lastViewed = lastViewed.filter(ch => 
      (ch.stream_id !== channel.stream_id) && (ch.id !== channel.id)
    );
    
    // Add the channel to the beginning of the array
    lastViewed.unshift({
      id: channel.id || channel.stream_id,
      stream_id: channel.stream_id || channel.id,
      name: channel.name,
      category_id: channel.category_id,
      timestamp: new Date().getTime()
    });
    
    // Keep only the last 10 items
    lastViewed = lastViewed.slice(0, 10);
    
    // Store back to localStorage
    localStorage.setItem('lastViewedChannels', JSON.stringify(lastViewed));
    
    return lastViewed;
  } catch (error) {
    console.error("Error updating last viewed channels:", error);
    return [];
  }
};

export default function Watch() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { 
    channels, 
    categories, 
    loading, 
    getChannelById,
    countries = [],
    channelTypes = [],
    qualities = [],
    selectedCountry,
    selectedType,
    selectedQuality,
    setSelectedCountry,
    setSelectedType,
    setSelectedQuality,
    resetFilters
  } = useIptv();
  
  const [currentChannel, setCurrentChannel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [lastViewedChannels, setLastViewedChannels] = useState([]);
  const channelsPerPage = 20;
  const channelListRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Focus search input when filters are shown
  useEffect(() => {
    if (showFilters && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showFilters]);
  
  // Load initial last viewed channels
  useEffect(() => {
    try {
      const lastViewedJSON = localStorage.getItem('lastViewedChannels');
      if (lastViewedJSON) {
        const lastViewed = JSON.parse(lastViewedJSON);
        setLastViewedChannels(lastViewed);
      }
    } catch (error) {
      console.error("Error loading last viewed channels:", error);
    }
  }, []);
  
  // Load channel from the ID in URL
  const loadChannel = useCallback(() => {
    if (!streamId || !channels.length) return;

    console.log(`Loading channel with ID: ${streamId}`);
    
    try {
      const channel = getChannelById(streamId);
      
      if (channel) {
        console.log(`Channel found: "${channel.name}"`);
        setCurrentChannel(channel);
        
        // Update last viewed channels locally instead of using context
        const updated = updateLastViewedChannelsLocally(channel);
        setLastViewedChannels(updated);
        
        // Set current category if available
        if (channel.category_id) {
          setCurrentCategory(channel.category_id.toString());
        }
      } else {
        console.error(`Channel with ID ${streamId} not found`);
      }
    } catch (err) {
      console.error("Error retrieving channel:", err);
    }
  }, [streamId, channels.length, getChannelById]);

  // Load channel when component mounts or streamId changes
  useEffect(() => {
    loadChannel();
    // Reset to page 1 when filter/search criteria change
    setPageNumber(1);
  }, [loadChannel, searchTerm, selectedCountry, selectedType, selectedQuality, currentCategory]);
  
  // Filter channels based on search and filters
  const filteredChannels = channels
    .filter(channel => {
      // Filter by category
      if (currentCategory !== 'all' && channel.category_id?.toString() !== currentCategory) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm && !channel.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by country, type and quality
      if (selectedCountry && selectedCountry !== 'all' && channel.country !== selectedCountry) {
        return false;
      }
      if (selectedType && selectedType !== 'all' && channel.channel_type !== selectedType) {
        return false;
      }
      if (selectedQuality && selectedQuality !== 'all' && channel.quality !== selectedQuality) {
        return false;
      }
      
      return true;
    });
  
  // Paginate channels
  const totalPages = Math.ceil(filteredChannels.length / channelsPerPage);
  const paginatedChannels = filteredChannels.slice(
    (pageNumber - 1) * channelsPerPage,
    pageNumber * channelsPerPage
  );
  
  // Function to change channel
  const changeChannel = (channel) => {
    if (!channel) {
      console.error("Attempted to change to a null channel");
      return;
    }
    
    // Get a valid ID
    const channelId = channel.stream_id || channel.id || channel.num;
    
    if (channelId) {
      console.log(`Navigating to channel with ID: ${channelId}`);
      navigate(`/watch/${channelId}`);
    } else {
      console.error("Invalid channel without ID:", channel);
    }
  };
  
  // Handle pagination
  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      setPageNumber(current => current + 1);
      // Scroll back to top of channel list
      if (channelListRef.current) {
        channelListRef.current.scrollTop = 0;
      }
    }
  };
  
  const handlePrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(current => current - 1);
      // Scroll back to top of channel list
      if (channelListRef.current) {
        channelListRef.current.scrollTop = 0;
      }
    }
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  return (
    <div className="watch-container">
      {/* Video Player */}
      <div className={`player-container ${!sidebarVisible ? 'fullscreen' : ''}`}>
        {currentChannel ? (
          <VideoPlayer channel={currentChannel} />
        ) : (
          <div className="player-placeholder">
            {loading ? 'Chargement...' : 'Sélectionnez une chaîne pour commencer'}
          </div>
        )}
        
        {/* Channel info overlay */}
        {currentChannel && (
          <div className="channel-info-overlay">
            <h2>{currentChannel.name}</h2>
            <div className="channel-meta">
              {currentChannel.quality && (
                <span className="quality-tag">{currentChannel.quality}</span>
              )}
              {currentChannel.channel_type && (
                <span className="type-tag">{currentChannel.channel_type}</span>
              )}
              <RiLiveLine className="live-icon" />
            </div>
          </div>
        )}
        
        {/* Toggle sidebar button */}
        <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
          {sidebarVisible ? '>' : '<'}
        </button>
      </div>
      
      {/* Sidebar */}
      {sidebarVisible && (
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="back-button" onClick={() => navigate('/')}>
              <IoArrowBack /> Retour
            </button>
            
            <div className="search-filter-container">
              <div className="search-container">
                <IoSearchOutline className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
                )}
              </div>
              
              <button 
                className={`filter-button ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <IoFilterOutline /> Filtres
              </button>
            </div>
            
            {showFilters && (
              <div className="filters-panel">
                {/* Country filter */}
                {countries && countries.length > 0 && (
                  <div className="filter-group">
                    <label>Pays:</label>
                    <select 
                      value={selectedCountry || 'all'} 
                      onChange={(e) => {
                        if (typeof setSelectedCountry === 'function') {
                          setSelectedCountry(e.target.value);
                        }
                      }}
                    >
                      <option value="all">Tous les pays</option>
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Channel type filter */}
                {channelTypes && channelTypes.length > 0 && (
                  <div className="filter-group">
                    <label>Type:</label>
                    <select 
                      value={selectedType || 'all'} 
                      onChange={(e) => {
                        if (typeof setSelectedType === 'function') {
                          setSelectedType(e.target.value);
                        }
                      }}
                    >
                      <option value="all">Tous les types</option>
                      {channelTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Quality filter */}
                {qualities && qualities.length > 0 && (
                  <div className="filter-group">
                    <label>Qualité:</label>
                    <select 
                      value={selectedQuality || 'all'} 
                      onChange={(e) => {
                        if (typeof setSelectedQuality === 'function') {
                          setSelectedQuality(e.target.value);
                        }
                      }}
                    >
                      <option value="all">Toutes les qualités</option>
                      {qualities.map(quality => (
                        <option key={quality} value={quality}>{quality}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {typeof resetFilters === 'function' && (
                  <button 
                    className="reset-filters-btn" 
                    onClick={() => {
                      resetFilters();
                      setSearchTerm('');
                      setCurrentCategory('all');
                    }}
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
            
            {/* Recently viewed channels */}
            {lastViewedChannels.length > 0 && (
              <div className="recently-viewed-section">
                <h3>Récemment vus</h3>
                <div className="recently-viewed-list">
                  {lastViewedChannels.slice(0, 5).map(channel => (
                    <button
                      key={`recent-${channel.stream_id || channel.id}`}
                      className="recently-viewed-item"
                      onClick={() => changeChannel(channel)}
                    >
                      {channel.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Categories tabs */}
            <div className="categories-tabs">
              <button 
                className={`category-tab ${currentCategory === 'all' ? 'active' : ''}`}
                onClick={() => setCurrentCategory('all')}
              >
                Tout
              </button>
              {categories && categories.slice(0, 8).map(category => (
                <button 
                  key={category.category_id} 
                  className={`category-tab ${currentCategory === category.category_id.toString() ? 'active' : ''}`}
                  onClick={() => setCurrentCategory(category.category_id.toString())}
                >
                  {category.category_name}
                </button>
              ))}
              {categories && categories.length > 8 && (
                <div className="categories-dropdown">
                  <button className="categories-more-btn">
                    Plus <IoChevronDown />
                  </button>
                  <div className="categories-dropdown-content">
                    {categories.slice(8).map(category => (
                      <button 
                        key={category.category_id} 
                        className={`category-item ${currentCategory === category.category_id.toString() ? 'active' : ''}`}
                        onClick={() => setCurrentCategory(category.category_id.toString())}
                      >
                        {category.category_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Channel list */}
          <div className="channel-list-container">
            <div className="channels-count">
              {filteredChannels.length} chaînes trouvées
            </div>
            
            <div className="channel-list" ref={channelListRef}>
              {loading ? (
                <div className="loading-channels">
                  <div className="loading-spinner"></div>
                  Chargement des chaînes...
                </div>
              ) : paginatedChannels.length > 0 ? (
                paginatedChannels.map(channel => (
                  <div 
                    key={channel.stream_id || channel.id || channel.num}
                    className={`channel-item ${currentChannel && (currentChannel.stream_id === channel.stream_id || currentChannel.id === channel.id) ? 'active' : ''}`}
                    onClick={() => changeChannel(channel)}
                  >
                    <div className="channel-info">
                      <div className="channel-number">{channel.num || channel.stream_id || channel.id}</div>
                      <div className="channel-name">{channel.name}</div>
                    </div>
                    {channel.quality && (
                      <div className="channel-quality">{channel.quality}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-channels-found">
                  Aucune chaîne trouvée
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {filteredChannels.length > channelsPerPage && (
              <div className="pagination-controls">
                <button 
                  className="pagination-btn" 
                  onClick={handlePrevPage}
                  disabled={pageNumber <= 1}
                >
                  Précédent
                </button>
                <div className="pagination-info">
                  Page {pageNumber} sur {totalPages}
                </div>
                <button 
                  className="pagination-btn" 
                  onClick={handleNextPage}
                  disabled={pageNumber >= totalPages}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
