// src/pages/Watch.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIptv } from '../context/IptvContext';
import VideoPlayer from '../components/VideoPlayer';
import { IoArrowBack, IoSearchOutline, IoFilterOutline } from 'react-icons/io5';
import { RiLiveLine } from 'react-icons/ri';

export default function Watch() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { 
    channels, 
    categories, 
    loading, 
    getChannelById,
    updateLastViewedChannels,
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
  
  const loadChannel = useCallback(() => {
    if (!streamId) return;

    try {
      const channel = getChannelById(streamId);
      
      if (channel) {
        console.log(`[Watch] Chaîne trouvée: "${channel.name}" (ID: ${streamId})`);
        setCurrentChannel(channel);
        updateLastViewedChannels(channel);
      } else {
        console.error(`[Watch] Chaîne avec ID ${streamId} non trouvée`);
        //setError(`Chaîne non trouvée (ID: ${streamId})`);
      }
    } catch (err) {
      console.error("[Watch] Erreur lors de la récupération de la chaîne:", err);
      //setError(`Erreur: ${err.message}`);
    } finally {
      //setLoading(false);
    }
  }, [streamId, getChannelById, updateLastViewedChannels]);
  // Récupérer la chaîne actuelle
  useEffect(() => {
    console.log(`[Watch] Paramètre streamId changé: ${streamId}`);
    loadChannel(streamId);
    if (streamId && channels.length > 0) {
      console.log(`Recherche de la chaîne avec ID: ${streamId}`);
      const channel = getChannelById(streamId);
      if (channel) {
        console.log("Chaîne trouvée:", channel);
        setCurrentChannel(channel);
        updateLastViewedChannels(channel);
      } else {
        console.error(`Chaîne avec ID ${streamId} non trouvée dans ${channels.length} chaînes`);
      }
    }
    loadChannel();
  }, [streamId, channels, getChannelById, updateLastViewedChannels, loadChannel, ]);
  
  // Filtrer les chaînes
  const filteredChannels = channels
    .filter(channel => {
      // Filtre par recherche
      if (searchTerm && !channel.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtres par pays, type et qualité
      if (selectedCountry !== 'all' && channel.country !== selectedCountry) {
        return false;
      }
      if (selectedType !== 'all' && channel.channelType !== selectedType) {
        return false;
      }
      if (selectedQuality !== 'all' && channel.quality !== selectedQuality) {
        return false;
      }
      
      return true;
    })
    .slice(0, 100); // Limiter pour les performances
  
  // Fonction pour changer de chaîne
  const changeChannel = (channel) => {
    if (channel && (channel.id || channel.stream_id)) {
      const channelId = channel.id || channel.stream_id;
      navigate(`/watch/${channelId}`);
    }
  };


  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 60px)', 
      background: '#0f0f0f',
      color: '#f0f0f0',
      position: 'relative'
    }}>
      {/* Bouton pour afficher/masquer la barre latérale (visible uniquement quand la barre est cachée) */}
      {!sidebarVisible && (
        <button
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white'
          }}
        >
          <IoFilterOutline size={20} />
        </button>
      )}
      
      {/* Sidebar */}
      {sidebarVisible && (
        <div style={{ 
          width: '320px', 
          overflowY: 'auto', 
          borderRight: '1px solid #333',
          background: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <button 
                onClick={() => navigate('/')}
                style={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '8px 12px',
                  background: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff'
                }}
              >
                <IoArrowBack /> Retour
              </button>
              
              <button 
                onClick={toggleSidebar}
                style={{ 
                  cursor: 'pointer',
                  padding: '8px 12px',
                  background: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff'
                }}
              >
                Masquer
              </button>
            </div>
            
            {/* Barre de recherche */}
            <div style={{ position: 'relative', marginBottom: '15px' }}>
              <input 
                type="text" 
                placeholder="Rechercher une chaîne..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px 10px 10px 35px',
                  background: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
              />
              <IoSearchOutline style={{ 
                position: 'absolute', 
                left: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#aaa'
              }} />
            </div>
            
            {/* Bouton pour afficher/masquer les filtres */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{ 
                width: '100%',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#2a2a2a',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              <span><IoFilterOutline style={{ marginRight: '5px' }} /> Filtres</span>
              <span>{showFilters ? '▲' : '▼'}</span>
            </button>
            
            {/* Filtres avancés */}
            {showFilters && (
              <div style={{ 
                marginBottom: '15px', 
                padding: '10px', 
                background: '#242424', 
                borderRadius: '5px' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end',
                  marginBottom: '10px'
                }}>
                  <button 
                    onClick={resetFilters}
                    style={{ 
                      padding: '5px 8px',
                      background: 'transparent',
                      border: '1px solid #555',
                      borderRadius: '3px',
                      color: '#ccc',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Réinitialiser
                  </button>
                </div>
                
                {/* Sélecteur de pays */}
                {countries.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      Pays:
                    </label>
                    <select 
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '8px',
                        background: '#333',
                        border: '1px solid #555',
                        borderRadius: '3px',
                        color: '#fff'
                      }}
                    >
                      <option value="all">Tous les pays</option>
                      {countries.map((country, idx) => (
                        <option key={idx} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Sélecteur de type */}
                {channelTypes.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      Type:
                    </label>
                    <select 
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '8px',
                        background: '#333',
                        border: '1px solid #555',
                        borderRadius: '3px',
                        color: '#fff'
                      }}
                    >
                      <option value="all">Tous les types</option>
                      {channelTypes.map((type, idx) => (
                        <option key={idx} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Sélecteur de qualité */}
                {qualities.length > 0 && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      Qualité:
                    </label>
                    <select 
                      value={selectedQuality}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '8px',
                        background: '#333',
                        border: '1px solid #555',
                        borderRadius: '3px',
                        color: '#fff'
                      }}
                    >
                      <option value="all">Toutes les qualités</option>
                      {qualities.map((quality, idx) => (
                        <option key={idx} value={quality}>{quality}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            
            {/* Statistiques */}
            <div style={{ 
              fontSize: '14px',
              color: '#aaa', 
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Total: {channels.length} chaînes</span>
              <span>Filtré: {filteredChannels.length}</span>
            </div>
          </div>
          
          {/* Liste des chaînes */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ 
                  display: 'inline-block',
                  width: '30px',
                  height: '30px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  borderTopColor: '#fff',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '10px'
                }} />
                <div>Chargement des chaînes...</div>
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#aaa' }}>
                <p>Aucune chaîne ne correspond aux critères.</p>
                <button 
                  onClick={resetFilters}
                  style={{ 
                    padding: '8px 15px',
                    background: '#333',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              filteredChannels.map((channel) => (
                <div 
                  key={`channel-${channel.id || channel.stream_id}`} 
                  style={{
                    padding: '12px 15px',
                    borderBottom: '1px solid #2a2a2a',
                    cursor: 'pointer',
                    background: currentChannel && 
                      (currentChannel.id === channel.id || 
                       currentChannel.stream_id === channel.stream_id) 
                      ? '#2c3e50' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => changeChannel(channel)}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {channel.logoURL || channel.stream_icon ? (
                      <img 
                        src={channel.logoURL || channel.stream_icon} 
                        alt={channel.name} 
                        style={{ width: '40px', height: '40px', marginRight: '12px', objectFit: 'contain' }}
                        onError={(e) => {e.target.style.display = 'none'}}
                      />
                    ) : (
                      <div style={{ 
                        width: '40px', 
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#444',
                        borderRadius: '4px',
                        marginRight: '12px',
                        fontSize: '14px'
                      }}>
                        {channel.name?.substring(0, 2) || 'CH'}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '220px'
                      }}>
                        {channel.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#aaa', 
                        display: 'flex',
                        gap: '8px',
                        marginTop: '3px'
                      }}>
                        <span>{channel.category || channel.category_name || 'Autre'}</span>
                        {channel.quality && (
                          <span style={{
                            background: '#333',
                            padding: '0 5px',
                            borderRadius: '3px',
                            fontSize: '11px'
                          }}>
                            {channel.quality}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Zone principale - Lecteur vidéo */}
      <div style={{ 
        flex: 1, 
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {currentChannel ? (
          <>
            <div style={{ 
              padding: '15px', 
              background: 'rgba(0,0,0,0.8)',
              borderBottom: '1px solid #333'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>{currentChannel.name}</h2>
                
                {!sidebarVisible && (
                  <button 
                    onClick={toggleSidebar}
                    style={{ 
                      cursor: 'pointer',
                      padding: '6px 12px',
                      background: '#333',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                  >
                    Liste des chaînes
                  </button>
                )}
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                fontSize: '14px',
                color: '#bbb'
              }}>
                <span>{currentChannel.category || currentChannel.category_name || 'Aucune catégorie'}</span>
                {currentChannel.quality && (
                  <span style={{
                    background: '#333',
                    padding: '0 8px',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    {currentChannel.quality}
                  </span>
                )}
                {currentChannel.country && currentChannel.country !== 'Inconnu' && (
                  <span>{currentChannel.country}</span>
                )}
              </div>
            </div>
            
            <div style={{ flex: 1, position: 'relative' }}>
              <VideoPlayer 
                channel={currentChannel}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            flexDirection: 'column',
            color: '#ccc'
          }}>
            <RiLiveLine style={{ fontSize: '64px', marginBottom: '20px', opacity: '0.5' }} />
            <h2 style={{ marginBottom: '10px' }}>Sélectionnez une chaîne</h2>
            <p>Choisissez une chaîne dans la liste pour commencer à regarder</p>
            
            {!sidebarVisible && (
              <button 
                onClick={toggleSidebar}
                style={{ 
                  marginTop: '20px',
                  padding: '10px 20px',
                  background: '#333',
                  border: 'none', 
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Afficher la liste
              </button>
            )}
            
            {channels.length > 0 && (
              <button
                onClick={() => changeChannel(channels[0])}
                style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  background: '#2962ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Regarder la première chaîne
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
