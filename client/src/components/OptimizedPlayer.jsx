// src/components/OptimizedPlayer.jsx - Configuration spécifique pour France 3 FHD
import React, { useEffect, useRef, useState } from 'react';
import mpegts from 'mpegts.js';
import '../styles/VideoPlayer.css';

const OptimizedPlayer = ({ channelUrl, channelName }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bufferingState, setBufferingState] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [statsInfo, setStatsInfo] = useState({
    speed: 0,
    dropped: 0,
    bufferSize: 0
  });
  const loadingTimerRef = useRef(null);
  const statsIntervalRef = useRef(null);

  // Vérifier si mpegts est supporté
  useEffect(() => {
    if (!mpegts.isSupported()) {
      setError("Votre navigateur ne supporte pas mpegts.js. Utilisez Chrome ou Firefox récents.");
      setLoading(false);
      return;
    }
  }, []);

  // Initialiser le lecteur avec la configuration optimale pour ce flux spécifique
  useEffect(() => {
    const initPlayer = () => {
      if (!videoRef.current || !channelUrl) {
        setLoading(false);
        return;
      }

      // Nettoyage des instances précédentes
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }

      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
      
      // Définir un délai maximum pour le chargement (6 secondes)
      loadingTimerRef.current = setTimeout(() => {
        // Force cacher le spinner après ce délai
        setLoading(false);
      }, 6000);

      setLoading(true);
      setError(null);
      console.log(`Initialisation du player optimisé pour ${channelName || 'France 3 FHD'} (1080p/50fps H.264)`);

      // Configuration optimisée spécifiquement pour France 3 FHD (1080p/50fps H.264)
      // basée sur l'analyse ffprobe
      const player = mpegts.createPlayer({
        type: 'mpegts',        // Format MPEG-TS détecté
        isLive: true,          // Flux live
        url: channelUrl,
        cors: true,
        withCredentials: false,
        
        // Paramètres optimisés pour H.264 1080p@50fps
        enableWorker: true,    // Utiliser Web Worker pour décodage performance
        
        // Paramètres de buffer optimisés pour un flux à haute fréquence d'images (50fps)
        // Le flux a besoin d'un buffer légèrement plus grand pour compenser la cadence élevée
        liveBufferLatencyChasing: true,
        liveBufferLatencyMaxLatency: 2.5,  // 2.5 secondes (optimal pour 50fps H.264)
        liveBufferLatencyMinRemain: 0.8,   // Un peu plus de marge pour le buffer min
        
        // Configuration du stashBuffer - désactivé car on préfère une latence faible
        enableStashBuffer: false,
        
        // Optimisations pour réduire les saccades avec contenu 50fps
        autoCleanupSourceBuffer: true,
        autoCleanupMaxBackwardDuration: 5.0,  // Conserver 5s en arrière pour les segments I-frame
        autoCleanupMinBackwardDuration: 1.0,  // Minimum 1s de buffer arrière
        
        // Optimisations spécifiques au format et codec
        fixAudioTimestampGap: true,  // Important pour synchroniser l'audio EAC3 avec la vidéo
        reuseRedirectedURL: true,    // Réutiliser l'URL en cas de redirection (optimise les connexions)
        
        // Paramètres pour les connexions réseau instables
        seekType: 'range',           // Utiliser HTTP Range pour les requêtes partielles
        rangeLoadZeroStart: false,   // Ne pas commencer à zéro pour les requêtes range 
        
        // Options de performance pour contenu HD
        lazyLoad: false,             // Charger immédiatement, pas de chargement paresseux
        lazyLoadMaxDuration: 0,      // Pas de limite de durée pour le chargement initial
        lazyLoadRecoverDuration: 0,  // Pas de limite pour la récupération
        deferLoadAfterSourceOpen: false, // Ne pas différer le chargement
      });

      try {
        // Attacher le lecteur à l'élément vidéo
        player.attachMediaElement(videoRef.current);
        player.load();

        if (isPlaying) {
          videoRef.current.play().catch(e => {
            console.warn("Autoplay failed, waiting for user interaction", e);
          });
        }
        
        playerRef.current = player;
        videoRef.current.volume = volume;

        // Gestion des événements vidéo pour le buffering
        videoRef.current.addEventListener('waiting', () => {
          setBufferingState(true);
        });

        videoRef.current.addEventListener('playing', () => {
          console.log("Le flux commence à jouer");
          setBufferingState(false);
          setLoading(false);
        });

        videoRef.current.addEventListener('canplay', () => {
          console.log("Le flux peut être lu");
          setLoading(false);
        });
        
        // Gestion des statistiques pour affichage et débogage
        statsIntervalRef.current = setInterval(() => {
          if (playerRef.current && videoRef.current) {
            const stats = playerRef.current.statisticsInfo || {};
            
            setStatsInfo({
              speed: (stats.currentKbps || 0).toFixed(0),
              dropped: stats.droppedFrames || 0,
              bufferSize: (stats.videoBufferBytes || 0) / (1024 * 1024).toFixed(2)
            });
            
            // Si le buffer vidéo est suffisant, on peut considérer que ça charge bien
            if ((stats.videoBufferBytes || 0) > 3000000) { // >3MB en buffer
              setLoading(false);
            }
          }
        }, 1000);

        // Événements mpegts.js
        player.on(mpegts.Events.ERROR, (errorType, errorDetail) => {
          // Filtre: ne montrer que les erreurs fatales
          if (errorType === mpegts.ErrorTypes.NETWORK_ERROR || 
              errorType === mpegts.ErrorTypes.MEDIA_ERROR) {
            console.error(`Erreur mpegts: ${errorType}, ${errorDetail}`);
            setError(`Erreur: ${errorDetail}`);
            setLoading(false);
          }
        });

        player.on(mpegts.Events.MEDIA_INFO, (mediaInfo) => {
          console.log("Informations média:", mediaInfo);
        });

        player.on(mpegts.Events.STATISTICS_INFO, (stats) => {
          // Déjà traité par l'intervalle
        });

        player.on(mpegts.Events.LOADING_COMPLETE, () => {
          console.log("Chargement du segment terminé");
          setLoading(false);
        });
      } catch (e) {
        console.error("Erreur lors de l'initialisation du player:", e);
        setError(`Erreur d'initialisation: ${e.message}`);
        setLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
      
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [channelUrl, channelName]);

  // Mettre à jour le volume quand il change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Gérer la lecture/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => {
          console.error('Error playing video:', e);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Fonction pour réessayer la lecture en cas d'erreur
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    // Recréer le player
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    
    // Petit délai avant reconnexion
    setTimeout(() => {
      if (playerRef.current === null && videoRef.current) {
        // La config est appliquée à nouveau via l'effet
        setLoading(true);
      }
    }, 500);
  };

  // Fonction pour basculer lecture/pause
  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  // Fonction pour gérer le changement de volume
  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className="video-player-container">
      {/* Loading overlay avec détection des états */}
      {(loading || bufferingState) && (
        <div className="loading-overlay">
          <div className="loader"></div>
          <p>{loading ? 'Chargement du flux...' : 'Mise en mémoire tampon...'}</p>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRetry}>
            Réessayer
          </button>
        </div>
      )}

      {/* Lecteur vidéo */}
      <div className="player-wrapper">
        <video
          ref={videoRef}
          className="video-element"
          controls={false}
          autoPlay
          playsInline
        />
        
        {/* Overlay d'informations techniques (optionnel) */}
        {showStats && (
          <div className="video-stats-overlay">
            <div className="stat-item">Débit: {statsInfo.speed} kbps</div>
            <div className="stat-item">Images perdues: {statsInfo.dropped}</div>
            <div className="stat-item">Buffer: {statsInfo.bufferSize} MB</div>
          </div>
        )}
      </div>

      {/* Contrôles personnalisés */}
      <div className="custom-controls">
        <button onClick={togglePlay} className="play-pause-btn">
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        
        <div className="volume-control">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
          <span className="volume-percentage">{Math.round(volume * 100)}%</span>
        </div>
        
        <div className="control-buttons">
          <button onClick={handleRetry} className="retry-btn">
            🔄 Actualiser
          </button>
          
          <button 
            onClick={() => setShowStats(!showStats)} 
            className={`stats-btn ${showStats ? 'active' : ''}`}
          >
            📊 Stats
          </button>
        </div>
        
        {/* Badge de qualité */}
        <div className="quality-badge">
          <span>1080p</span>
          <span className="fps-tag">50fps</span>
        </div>
      </div>
    </div>
  );
};

export default OptimizedPlayer;
