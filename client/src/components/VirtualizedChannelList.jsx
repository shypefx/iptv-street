// src/components/VirtualizedChannelList.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import debounce from 'lodash.debounce';

const VirtualizedChannelList = ({ channels, onChannelSelect, selectedChannel }) => {
  const [filter, setFilter] = useState('');
  const [visibleChannels, setVisibleChannels] = useState(channels);
  const inputRef = useRef(null);
  
  // Filtrer les chaînes avec debounce pour éviter les rafraîchissements trop fréquents
  const debouncedFilter = useCallback(
    debounce((searchTerm) => {
      if (!searchTerm.trim()) {
        setVisibleChannels(channels);
        return;
      }
      
      const normalizedSearch = searchTerm.toLowerCase();
      const filtered = channels.filter(channel => 
        channel.name.toLowerCase().includes(normalizedSearch) ||
        channel.category.toLowerCase().includes(normalizedSearch)
      );
      setVisibleChannels(filtered);
    }, 300),
    [channels]
  );
  
  // Mettre à jour le filtre quand les chaînes changent
  useEffect(() => {
    if (filter) {
      debouncedFilter(filter);
    } else {
      setVisibleChannels(channels);
    }
  }, [channels, filter, debouncedFilter]);
  
  // Fonction pour gérer le changement du filtre
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    debouncedFilter(e.target.value);
  };
  
  // Effacer le filtre
  const clearFilter = () => {
    setFilter('');
    setVisibleChannels(channels);
    inputRef.current?.focus();
  };
  
  // Rendu d'un élément de la liste
  const ChannelItem = ({ index, style }) => {
    const channel = visibleChannels[index];
    const isSelected = selectedChannel && channel.id === selectedChannel.id;
    
    return (
      <div 
        style={{
          ...style,
          backgroundColor: isSelected ? '#2a5d8a' : index % 2 === 0 ? '#1e1e1e' : '#252525',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          cursor: 'pointer',
          borderBottom: '1px solid #333'
        }}
        onClick={() => onChannelSelect(channel)}
      >
        {channel.logoURL ? (
          <img 
            src={channel.logoURL} 
            alt=""
            style={{ width: '32px', height: '32px', marginRight: '10px', objectFit: 'contain' }}
            onError={(e) => { e.target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http://www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23CCC%22%20d%3D%22M21%203H3c-1.1%200-2%20.9-2%202v12c0%201.1.9%202%202%202h5v2h8v-2h5c1.1%200%202-.9%202-2V5c0-1.1-.9-2-2-2zm0%2014H3V5h18v12z%22/%3E%3C/svg%3E'; }}
          />
        ) : (
          <div style={{ width: '32px', height: '32px', marginRight: '10px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#999' }}>TV</span>
          </div>
        )}
        <div style={{ overflow: 'hidden' }}>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isSelected ? 'bold' : 'normal' }}>
            {channel.name}
          </div>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8em', color: '#999' }}>
            {channel.category}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px', background: '#1a1a1a' }}>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={filter}
            onChange={handleFilterChange}
            placeholder="Rechercher des chaînes..."
            style={{
              width: '100%',
              padding: '8px 36px 8px 12px',
              border: '1px solid #444',
              borderRadius: '4px',
              background: '#2a2a2a',
              color: '#fff'
            }}
          />
          {filter && (
            <button
              onClick={clearFilter}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0'
              }}
            >
              ×
            </button>
          )}
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#999' }}>
          {visibleChannels.length} chaînes sur {channels.length}
        </div>
      </div>
      
      <div style={{ flex: '1' }}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={visibleChannels.length}
              itemSize={60} // Hauteur de chaque élément
            >
              {ChannelItem}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default VirtualizedChannelList;
