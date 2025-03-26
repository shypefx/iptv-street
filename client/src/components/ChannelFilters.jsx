// src/components/ChannelFilters.jsx
import React from 'react';
import { useIptv } from '../context/IptvContext';
import '../styles/ChannelFilters.css'; // À créer selon votre design

const ChannelFilters = () => {
  const { 
    countries, 
    channelTypes, 
    qualities,
    selectedCountry,
    selectedType,
    selectedQuality,
    setSelectedCountry,
    setSelectedType,
    setSelectedQuality
  } = useIptv();
  
  return (
    <div className="channel-filters">
      <div className="filter-group">
        <label htmlFor="country-filter">Pays:</label>
        <select 
          id="country-filter" 
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          <option value="all">Tous les pays</option>
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label htmlFor="type-filter">Type:</label>
        <select 
          id="type-filter" 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="all">Tous les types</option>
          {channelTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label htmlFor="quality-filter">Qualité:</label>
        <select 
          id="quality-filter" 
          value={selectedQuality}
          onChange={(e) => setSelectedQuality(e.target.value)}
        >
          <option value="all">Toutes les qualités</option>
          {qualities.map(quality => (
            <option key={quality} value={quality}>{quality}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ChannelFilters;
