// src/components/VideoPlayer.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import mpegts from 'mpegts.js';
import '../styles/VideoPlayer.css';

// Optimisations globales de mpegts.js
if (mpegts.getFeatureList().mseLivePlayback) {
  mpegts.LoggingControl.enableVerbose = false;
  mpegts.LoggingControl.enableInfo = false;
  mpegts.LoggingControl.enableDebug = false;
}

// Fonction utilitaire pour obtenir l'URL du flux
const getStreamUrl = (ch) => {
  if (!ch) return null;
  
  // Vérifier toutes les propriétés possibles
  const url = ch.streamURL || ch.stream_url || ch.url || ch.stream;
  if (url) return url;
  
  // Vérifier s'il y a un tableau de flux
  if (ch.streams && Array.isArray(ch.streams) && ch.streams.length > 0) {
    // Priorité aux flux TS pour mpegts.js
    const tsStream = ch.streams.find(s => 
      s.url && typeof s.url === 'string' && s.url.toLowerCase().includes('.ts')
    );
    if (tsStream) return tsStream.url;
    
    return ch.streams[0].url;
  }
  
  // Vérifier si l'objet est une string URL
  if (typeof ch === 'string' && (ch.startsWith('http') || ch.startsWith('rtmp'))) {
    return ch;
  }
  
  // Cas spécial pour les API XtreamCodes
  if (ch.stream_id) {
    // Format standard Xtream Codes
    const server = localStorage.getItem('serverUrl') || '';
    if (server && ch.stream_type) {
      // stream_type: 1=m3u8, 2=ts, 3=rtmp, etc.
      const extension = ch.stream_type === 2 ? 'ts' : ch.stream_type === 1 ? 'm3u8' : 'ts';
      return `${server}/live/${localStorage.getItem('username')}/${localStorage.getItem('password')}/${ch.stream_id}.${extension}`;
    }
    // URL relative générique
    return `/streams/${ch.stream_id}.ts`;
  }

  return null;
};

// Comparaison profonde des objets chaîne pour éviter les rendus inutiles
const areChannelsEqual = (prevChannel, nextChannel) => {
  if (!prevChannel && !nextChannel) return true;
  if (!prevChannel || !nextChannel) return false;
  
  // Comparer les IDs si disponibles
  if (prevChannel.id && nextChannel.id) {
    return prevChannel.id === nextChannel.id;
  }
  
  // Comparer les URLs de flux
  const prevUrl = getStreamUrl(prevChannel);
  const nextUrl = getStreamUrl(nextChannel);
  
  return prevUrl === nextUrl;
};

// Composant principal optimisé avec comparaison personnalisée
const VideoPlayer = memo(({ channel, style = {} }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const stuckCheckIntervalRef = useRef(null);
  const channelRef = useRef(null); // Pour suivre les changements de chaîne
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [keyIndex, setKeyIndex] = useState(0); // Pour forcer le remontage
  
  // Mémoriser l'URL du flux pour éviter les recalculs inutiles
  const streamUrl = useMemo(() => getStreamUrl(channel), [channel]);
  
  // Vérifiez si la chaîne a changé
  const hasChannelChanged = useCallback(() => {
    return !areChannelsEqual(channelRef.current, channel);
  }, [channel]);
  
  // Fonction de nettoyage mémorisée
  const cleanupPlayer = useCallback(() => {
    if (stuckCheckIntervalRef.current) {
      clearInterval(stuckCheckIntervalRef.current);
      stuckCheckIntervalRef.current = null;
    }
    
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.unload();
        playerRef.current.destroy();
        playerRef.current = null;
      } catch (e) {
        console.warn("Erreur lors du nettoyage du lecteur:", e);
      }
    }
    
    // Nettoyer l'élément vidéo
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      } catch (e) {
        console.warn("Erreur lors du nettoyage de l'élément vidéo:", e);
      }
    }
  }, []);
  
  // Fonction pour réessayer la lecture
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setKeyIndex(prev => prev + 1);
  }, []);
  
  // Fonction pour créer le lecteur, mémorisée pour performance
  const createPlayer = useCallback((videoElement, url) => {
    if (!mpegts.getFeatureList().mseLivePlayback) {
      console.error("mpegts.js n'est pas pris en charge sur ce navigateur");
      setError("Votre navigateur ne prend pas en charge la lecture de flux TS");
      setLoading(false);
      return null;
    }
    
    console.log(`[mpegts] Création du lecteur pour: ${url}`);
    
    try {
      // Configuration optimisée pour la fluidité
      const config = {
        // Paramètres critiques pour éviter les saccades
        enableStashBuffer: true,
        stashInitialSize: 1024 * 1024,  // 1MB - buffer plus large pour éviter les saccades
        lazyLoadMaxDuration: 180,
        seekType: 'range',
        
        // Paramètres de latence
        liveBufferLatencyChasing: true,
        liveBufferLatencyMinRemain: 3.0, // Augmenté pour plus de stabilité
        liveBufferLatencyMaxLatency: 8.0, // Augmenté pour réduire les saccades
        liveSync: true,
        
        // Configuration réseau
        reuseRedirectedURL: true,
        deferLoadAfterSourceOpen: false,
        xhrWithCredentials: false,
        xhrTimeout: 30000,
        xhrResponseType: 'arraybuffer',
        
        // Optimisations
        fixAudioTimestampGap: true,
        enableWorker: true,
        accurateSeek: false,
        autoCleanupSourceBuffer: true,
        autoCleanupMaxBackwardDuration: 30,
        autoCleanupMinBackwardDuration: 15,
        
        // Debugging
        debug: false,
        statisticsInfoReportInterval: 5000, // Réduire la fréquence des rapports
      };
      
      // Création du joueur
      const player = mpegts.createPlayer({
        type: 'mpegts',  // Forcer mpegts au lieu de mse pour plus de stabilité
        isLive: true,
        url: url,
        cors: true,
        withCredentials: false
      }, config);
      
      player.attachMediaElement(videoElement);
      
      // Configurer le volume et autres paramètres vidéo
      videoElement.volume = 1.0;
      videoElement.preload = 'auto';
      
      // Système de surveillance et récupération des saccades
      let lastTime = 0;
      let stuckCount = 0;
      let playbackStarted = false;
      
      // Surveillance des saccades
      const startStuckDetection = () => {
        if (stuckCheckIntervalRef.current) clearInterval(stuckCheckIntervalRef.current);
        
        stuckCheckIntervalRef.current = setInterval(() => {
          if (!playbackStarted || !videoElement) return;
          
          // Vérifier si la chaîne a changé pendant l'intervalle
          if (hasChannelChanged()) {
            console.log("[mpegts] Chaîne changée, arrêt de la surveillance");
            clearInterval(stuckCheckIntervalRef.current);
            stuckCheckIntervalRef.current = null;
            return;
          }
          
          if (videoElement.paused) {
            console.log("[mpegts] Vidéo en pause, tentative de reprise");
            videoElement.play().catch(e => console.warn("Échec de la reprise:", e));
            return;
          }
          
          const currentTime = videoElement.currentTime;
          if (Math.abs(currentTime - lastTime) < 0.05 && !videoElement.paused) {
            stuckCount++;
            
            // Si bloqué pendant 3 vérifications (6+ secondes)
            if (stuckCount >= 3) {
              console.warn("[mpegts] Vidéo bloquée, reconfiguration du buffer");
              
              // Tentative de correction douce, sans interruption visible
              const bufferedEnd = videoElement.buffered.length > 0 
                ? videoElement.buffered.end(videoElement.buffered.length - 1) 
                : 0;
                
              if (bufferedEnd > currentTime + 0.5) {
                // Avancer légèrement dans le buffer (moins visible pour l'utilisateur)
                console.log("[mpegts] Avance dans le buffer existant");
                videoElement.currentTime = currentTime + 0.5;
              } else {
                // Approche plus drastique si nécessaire
                player.unload();
                setTimeout(() => {
                  if (playerRef.current === player) {
                    player.load();
                    player.play();
                  }
                }, 300);
              }
              
              stuckCount = 0;
            }
          } else {
            // La vidéo progresse normalement
            stuckCount = 0;
          }
          
          lastTime = currentTime;
        }, 2000); // Vérification toutes les 2 secondes
      };
      
      // Événements mpegts.js
      player.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
        // Vérifier si la chaîne a changé depuis que l'erreur s'est produite
        if (hasChannelChanged()) {
          console.log("[mpegts] Erreur ignorée car la chaîne a changé");
          return;
        }
        
        console.error(`[mpegts] Erreur: ${errorType}, ${errorDetail}`, errorInfo);
        
        if (errorType === mpegts.ErrorTypes.NETWORK_ERROR) {
          setError(`Erreur réseau: ${errorDetail}`);
          
          // Tentative de récupération automatique pour les erreurs réseau
          player.unload();
          setTimeout(() => {
            if (playerRef.current === player && !hasChannelChanged()) {
              player.load();
              player.play().catch(e => console.warn("Échec de la reprise après erreur réseau:", e));
            }
          }, 3000);
        } else if (errorType === mpegts.ErrorTypes.MEDIA_ERROR) {
          if (!error && !hasChannelChanged()) {
            setError(`Erreur média: ${errorDetail}`);
          }
          
          // Récupération des erreurs média
          player.unload();
          setTimeout(() => {
            if (playerRef.current === player && !hasChannelChanged()) {
              player.load();
              player.play().catch(e => console.warn("Échec de la reprise après erreur média:", e));
            }
          }, 1000);
        } else {
          if (!hasChannelChanged()) {
            setError(`Erreur: ${errorDetail}`);
          }
        }
      });
      
      player.on(mpegts.Events.METADATA_ARRIVED, () => {
        console.log("[mpegts] Métadonnées reçues");
      });
      
      player.on(mpegts.Events.SCRIPTDATA_ARRIVED, () => {
        console.log("[mpegts] Données de script reçues");
      });
      
      player.on(mpegts.Events.MEDIA_INFO, (mediaInfo) => {
        console.log("[mpegts] Infos média reçues:", mediaInfo);
      });
      
      // Événements de l'élément vidéo
      videoElement.addEventListener('loadeddata', () => {
        if (hasChannelChanged()) return;
        
        playbackStarted = true;
        setLoading(false);
        
        // Commencer la détection de saccades après un petit délai
        setTimeout(() => {
          if (!hasChannelChanged()) {
            startStuckDetection();
          }
        }, 1000);
        
        videoElement.play().catch(e => {
          console.error("Erreur lecture auto:", e);
          if (e.name === 'NotAllowedError' && !hasChannelChanged()) {
            setError("Cliquez pour lancer la lecture");
          }
        });
      });
      
      videoElement.addEventListener('playing', () => {
        if (hasChannelChanged()) return;
        
        console.log("[mpegts] Lecture démarrée");
        setLoading(false);
        setError(null);
      });
      
      videoElement.addEventListener('waiting', () => {
        if (!hasChannelChanged()) {
          console.log("[mpegts] Mise en buffer...");
        }
      });
      
      videoElement.addEventListener('stalled', () => {
        if (!hasChannelChanged()) {
          console.warn("[mpegts] Lecture interrompue, rebuffering...");
        } 
      });
      
      // Lancer la lecture
      player.load();
      
      return player;
    } catch (err) {
      console.error("[mpegts] Erreur création du lecteur:", err);
      if (!hasChannelChanged()) {
        setError(`Erreur d'initialisation: ${err.message}`);
        setLoading(false);
      }
      return null;
    }
  }, [error, hasChannelChanged]);
  
  // Effet principal pour initialiser le lecteur
  useEffect(() => {
    // Vérifier si la chaîne a changé
    const channelChanged = !areChannelsEqual(channelRef.current, channel);
    
    // Si la chaîne a changé, mettre à jour la référence et nettoyer l'ancien lecteur
    if (channelChanged) {
      console.log("[VideoPlayer] Chaîne changée, recréation du lecteur");
      channelRef.current = channel;
      
      // Nettoyer l'ancien lecteur
      cleanupPlayer();
      
      // Réinitialiser les états
      setError(null);
      setLoading(true);
    }
    
    if (!channel) {
      setError("Aucune chaîne sélectionnée");
      setLoading(false);
      return;
    }
    
    // Obtenir et vérifier l'URL du flux
    if (!streamUrl) {
      console.error("Pas d'URL de flux trouvée:", channel);
      setError("URL du flux introuvable pour cette chaîne");
      setLoading(false);
      return;
    }
    
    // Créer le nouveau lecteur uniquement si la chaîne a changé ou si nous forçons un remontage
    if (channelChanged || playerRef.current === null) {
      setCurrentUrl(streamUrl);
      console.log(`[VideoPlayer] Lecture de "${channel.name || 'chaîne'}" URL: ${streamUrl}`);
      
      // Référence à l'élément vidéo 
      const videoElement = videoRef.current;
      if (!videoElement) return;
      
      // Création du lecteur
      const player = createPlayer(videoElement, streamUrl);
      playerRef.current = player;
    }
    
    // S'assurer que le lecteur est arrêté au démontage du composant
    return () => {
      // Ne pas nettoyer ici si nous allons recréer le lecteur immédiatement
      // Le nettoyage se fait au début de l'effet si la chaîne change
    };
  }, [channel, keyIndex, streamUrl, cleanupPlayer, createPlayer, hasChannelChanged]);
  
  // Effet de nettoyage au démontage
  useEffect(() => {
    return () => {
      console.log("[VideoPlayer] Démontage du composant, nettoyage complet");
      
      // Nettoyer le lecteur
      cleanupPlayer();
      
      // Nettoyer d'autres ressources potentiellement en fuite
      const cleanupGarbage = () => {
        // Rechercher et supprimer les objets en mémoire liés à mpegts.js
        const memoryObjects = Object.keys(window)
          .filter(key => key.startsWith('mpegts_') || key.includes('MediaSource'));
        
        memoryObjects.forEach(key => {
          try {
            window[key] = null;
            delete window[key];
          } catch (e) {
            // Ignorer les erreurs
          }
        });
      };
      
      // Exécuter le nettoyage après un petit délai
      setTimeout(cleanupGarbage, 100);
    };
  }, [cleanupPlayer]);
  
  // Rendu du composant
  return (
    <div className="mpegts-video-player" style={style}>
      {loading && (
        <div className="video-loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Chargement du stream...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="video-error-overlay">
          <div className="error-container">
            <h3 className="error-title">Erreur de lecture</h3>
            <p className="error-message">{error}</p>
            <p className="error-url">
              URL: {currentUrl ? currentUrl.substring(0, 50) + (currentUrl.length > 50 ? '...' : '') : 'N/A'}
            </p>
            
            <div className="error-buttons">
              <button 
                onClick={() => window.location.reload()} 
                className="error-button reload-button"
              >
                Recharger la page
              </button>
              
              <button 
                onClick={handleRetry}
                className="error-button retry-button"
              >
                Réessayer
              </button>
            </div>
            
            {error.includes("Cliquez pour lancer") && (
              <div className="autoplay-notice">
                (Politique du navigateur: l'interaction de l'utilisateur est requise)
              </div>
            )}
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="mpegts-video"
        controls
        playsInline
        autoPlay
        preload="auto"
        x-webkit-airplay="allow"
        webkit-playsinline="true"
        crossOrigin="anonymous"
        onClick={() => {
          if (videoRef.current && error && error.includes("Cliquez pour lancer")) {
            setError(null);
            videoRef.current.play().catch(e => {
              console.error("Erreur lors du clic pour lire:", e);
            });
          }
        }}
      ></video>
    </div>
  );
}, (prevProps, nextProps) => {
  // Logique personnalisée pour empêcher les rendus inutiles
  // Ne rendre à nouveau que si l'ID ou l'URL du flux change
  return areChannelsEqual(prevProps.channel, nextProps.channel) && 
         prevProps.style === nextProps.style;
});

export default VideoPlayer;
