// src/components/ChannelLoadingProgress.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIptv } from '../context/IptvContext';

const LoadingProgress = () => {
  const { loading, loadingProgress = { loaded: 0, total: 100 } } = useIptv();
  const [loadedChannels, setLoadedChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState('');
  const [totalLoaded, setTotalLoaded] = useState(0);

  // Utiliser une valeur par défaut pour loadingProgress.total
  const total = loadingProgress?.total || 100;
  const loaded = loadingProgress?.loaded || 0;

  // Simuler la réception de nouveaux noms de chaînes
  useEffect(() => {
    if (!loading) return;

    // Simuler la réception progressive des noms de chaînes
    const channelNames = [
      'France 2', 'TF1', 'M6', 'France 3', 'Canal+', 'Arte', 
      'W9', 'C8', 'TMC', 'TFX', 'NRJ 12', 'France 5', 'BFM TV',
      'CNews', 'CStar', 'Gulli', 'TF1 Séries Films', 'L\'Équipe',
      'RMC Story', 'RMC Découverte', 'Chérie 25', 'LCI', 'France Info',
      'Paris Première', 'TV5 Monde', 'Canal+ Sport', 'Canal+ Cinéma',
      'BBC World', 'CNN', 'Eurosport', 'MTV', 'Disney Channel'
    ];
    
    // Garder seulement 5 chaînes dans la liste à la fois
    const MAX_CHANNELS_DISPLAYED = 5;
    
    const interval = setInterval(() => {
      if (totalLoaded < total) {
        const newTotalLoaded = Math.min(totalLoaded + 1, total);
        setTotalLoaded(newTotalLoaded);
        
        // Utiliser un nom de chaîne de la liste ou générer un nom générique
        const randomIndex = Math.floor(Math.random() * channelNames.length);
        const channelName = channelNames[randomIndex];
        
        setCurrentChannel(channelName);
        
        // Ajouter à la liste des chaînes chargées mais limiter à MAX_CHANNELS_DISPLAYED
        setLoadedChannels(prev => {
          const newList = [...prev, channelName];
          if (newList.length > MAX_CHANNELS_DISPLAYED) {
            return newList.slice(-MAX_CHANNELS_DISPLAYED);
          }
          return newList;
        });
      } else {
        clearInterval(interval);
      }
    }, 300); // Vitesse d'ajout des chaînes
    
    return () => clearInterval(interval);
  }, [loading, total, totalLoaded]);
  
  // Si pas de chargement actif, ne rien afficher
  if (!loading) return null;

  return (
    <div className="channel-loading-container">
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
        <motion.p 
          className="connecting-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Connexion en cours...
        </motion.p>
      </div>

      <div className="channel-loader-status">
        <motion.div 
          className="channel-loader-progress"
          initial={{ width: '0%' }}
          animate={{ width: `${(totalLoaded / total) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
        <p className="channel-loader-count">
          {totalLoaded} / {total} chaînes
        </p>
      </div>
      
      <div className="channel-loading-list">
        <AnimatePresence mode="popLayout">
          {loadedChannels.map((channel, index) => (
            <motion.div
              key={`${channel}-${index}`}
              className="channel-loading-item"
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="channel-loading-icon">✓</span>
              <span className="channel-loading-name">{channel}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {currentChannel && (
          <motion.div 
            className="current-loading-channel"
            key={`current-${totalLoaded}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="loading-dot-animation">chargement</span>
            <span className="current-channel-name">{currentChannel}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LoadingProgress;
