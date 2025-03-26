// src/components/VideoPlayer.jsx - Version optimisée
import React, { useEffect, useRef, useState } from 'react';
import mpegts from 'mpegts.js';
import '../styles/VideoPlayer.css';

const VideoPlayer = ({ channelUrl }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isPlaying, setIsPlaying] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [bufferingState, setBufferingState] = useState(false);
  const loadingTimerRef = useRef(null);

  // Vérifier si mpegts est supporté
  useEffect(() => {
    if (!mpegts.isSupported()) {
      setError("Votre navigateur ne supporte pas mpegts.js. Essayez Chrome ou Firefox récents.");
      setLoading(false);
      return;
    }
  }, []);

  // Initialiser le lecteur lorsque l'URL change ou à la première création
  useEffect(() => {
    // Fonction pour initialiser le lecteur
    const initPlayer = () => {
      if (!videoRef.current) return;
      if (!channelUrl) {
        setLoading(false);
        return;
      }

      // Nettoyer le lecteur existant si présent
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      setLoading(true);
      setError(null);
      console.log("Initializing player with URL:", channelUrl);

      // Définir un délai maximum pour le chargement (8 secondes)
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      
      loadingTimerRef.current = setTimeout(() => {
        // Si on est toujours en chargement après le délai, on considère que le flux est stable
        // mais le spinner de chargement était coincé
        setLoading(false);
      }, 8000);

      // Configuration optimisée mpegts.js pour les flux live
      const player = mpegts.createPlayer({
        type: 'mse',
        isLive: true,
        url: channelUrl,
        cors: true,
        withCredentials: false,
        
        // Paramètres de buffer optimisés
        liveBufferLatencyChasing: true,
        liveBufferLatencyMaxLatency: 2.0,  // secondes
        liveBufferLatencyMinRemain: 0.5,   // secondes
        
        // Désactiver le stashBuffer pour les flux live
        enableStashBuffer: false,
        
        // Optimisations pour la stabilité
        autoCleanupSourceBuffer: true,
        autoCleanupMaxBackwardDuration: 5,
        autoCleanupMinBackwardDuration: 1
      });

      // Attacher le lecteur à l'élément vidéo
      try {
        player.attachMediaElement(videoRef.current);
        player.load();

        playerRef.current = player;
        videoRef.current.volume = volume;

        // Pour éviter les pauses avec autoplay
        const attemptPlay = () => {
          videoRef.current.play()
            .catch(e => {
              console.warn('AutoPlay prevented, waiting for user interaction', e);
            });
        };

        // Essayer de démarrer la lecture une fois que suffisamment de données sont mises en buffer
        player.on(mpegts.Events.MEDIA_INFO, () => {
          attemptPlay();
        });

        // Événements pour gérer les états du buffer
        videoRef.current.addEventListener('waiting', () => {
          setBufferingState(true);
        });

        videoRef.current.addEventListener('playing', () => {
          setBufferingState(false);
          setLoading(false); // Masquer le spinner de chargement quand la vidéo joue
        });

        // Détecter quand la vidéo est effectivement en cours de lecture
        videoRef.current.addEventListener('canplay', () => {
          if (isPlaying) {
            attemptPlay();
          }
          setLoading(false);
        });

        // Écouter les événements mpegts
        player.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
          console.error('mpegts error:', errorType, errorDetail, errorInfo);
          // Uniquement afficher l'erreur si c'est vraiment une erreur fatale
          if (errorType === mpegts.ErrorTypes.NETWORK_ERROR || 
              errorType === mpegts.ErrorTypes.MEDIA_ERROR) {
            setError(`Erreur de lecture: ${errorDetail}`);
            setLoading(false);
          }
        });

        player.on(mpegts.Events.STATISTICS_INFO, (stats) => {
          // Uniquement pour le débogage
          // console.log('Buffer Health:', stats.videoBufferBytes, 'bytes');
          
          // Si nous avons des données et que le buffer se remplit, on peut considérer
          // que le chargement est terminé
          if (stats.videoBufferBytes > 1000000) { // >1MB en buffer
            setLoading(false);
          }
        });

        player.on(mpegts.Events.LOADING_COMPLETE, () => {
          console.log('mpegts loading complete');
          setLoading(false);
        });

        // Important: Gérer la récupération après des erreurs de flux
        player.on(mpegts.Events.RECOVERED_EARLY_EOF, () => {
          console.log('mpegts recovered from early EOF');
          setLoading(false);
        });
      } catch (e) {
        console.error('Error initializing player:', e);
        setError(`Erreur d'initialisation du lecteur: ${e.message}`);
        setLoading(false);
      }
    };

    // Initialiser le lecteur
    initPlayer();

    // Nettoyer lors de la destruction du composant
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [channelUrl, retryCount]);

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

  // Fonction pour réessayer la lecture
  const handleRetry = () => {
    setLoading(true);
    setRetryCount(prev => prev + 1);
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
      {/* Afficher uniquement pendant le chargement initial ou quand explicitement en buffering */}
      {(loading || bufferingState) && (
        <div className="loading-overlay">
          <div className="loader"></div>
          <p>{loading ? 'Chargement du flux...' : 'Mise en mémoire tampon...'}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRetry}>
            Réessayer
          </button>
        </div>
      )}

      <div className="player-wrapper">
        <video
          ref={videoRef}
          className="video-element"
          controls={false}
          autoPlay
          playsInline
          onError={() => {
            setError("Erreur lors de la lecture du flux");
            setLoading(false);
          }}
        />
      </div>

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
        
        <button onClick={handleRetry} className="retry-btn">
          🔄 Actualiser
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
