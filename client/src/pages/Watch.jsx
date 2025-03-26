// src/pages/Watch.jsx
import { useState, useEffect } from 'react';
import { useIptv } from '../context/IptvContext';
import ChannelList from '../components/ChannelList';
import OptimizedPlayer from '../components/OptimizedPlayer';  
import '../styles/Watch.css';

export default function Watch() {
  const { channels } = useIptv();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extraire les pays uniques des chaînes
  useEffect(() => {
    if (channels && channels.length > 0) {
      setLoading(false);
      
      // Extraire tous les pays uniques des chaînes
      const uniqueCountries = Array.from(
        new Set(channels.map(channel => channel.country).filter(Boolean))
      ).sort();
      
      setCountries(uniqueCountries);
      
      // Appliquer les filtres initiaux
      filterChannels();
    }
  }, [channels]);

  // Effet pour filtrer les chaînes quand les critères changent
  useEffect(() => {
    filterChannels();
  }, [searchTerm, selectedCountry, channels]);

  const filterChannels = () => {
    if (!channels) return;
    
    let result = [...channels];
    
    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(channel => 
        (channel.name && channel.name.toLowerCase().includes(searchLower)) || 
        (channel.category && channel.category.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtre par pays
    if (selectedCountry) {
      result = result.filter(channel => 
        channel.country === selectedCountry
      );
    }
    
    setFilteredChannels(result);
  };

  // Gérer la sélection d'une chaîne
  const handleChannelSelect = (channel) => {
    console.log('Selected channel:', channel);
    setSelectedChannel(channel);
  };

  // Gérer le changement de recherche
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Gérer le changement de pays
  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCountry('');
  };

  return (
    <div className="watch-page">
      <div className="filter-section">
        <h2>Rechercher des chaînes</h2>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher par nom ou catégorie..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="country-filter">
          <select 
            value={selectedCountry} 
            onChange={handleCountryChange}
          >
            <option value="">Tous les pays</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          
          {(searchTerm || selectedCountry) && (
            <button onClick={resetFilters} className="reset-filters">
              Réinitialiser les filtres
            </button>
          )}
        </div>
        
        <div className="results-count">
          {filteredChannels.length} chaîne(s) trouvée(s)
        </div>
      </div>

      <div className="content-area">
        {loading ? (
          <div className="loading-message">Chargement des chaînes...</div>
        ) : (
          <div className="channels-and-player">
            <div className="channels-section">
              <ChannelList
                channels={filteredChannels}
                onChannelSelect={handleChannelSelect}
                selectedChannel={selectedChannel}
              />
            </div>
            
            {selectedChannel && (
              <div className="player-section">
                <div className="channel-info">
                  <h3>{selectedChannel.name}</h3>
                  {selectedChannel.country && <span className="country">{selectedChannel.country}</span>}
                  {selectedChannel.category && <span className="category">{selectedChannel.category}</span>}
                </div>
                
                <OptimizedPlayer 
                  channelUrl={selectedChannel.streamURL}
                  channelName={selectedChannel.name} 
                />
              </div>
            )}
            
            {!selectedChannel && (
              <div className="no-selection-message">
                Sélectionnez une chaîne pour commencer à regarder
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
