// src/components/Player.jsx
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useIPTV } from '../contexts/IPTVContext';
import mpegts from 'mpegts.js';

export default function Player() {
  const { currentChannel } = useIPTV();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const mpegtsRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePlayerType, setActivePlayerType] = useState(null);
  const [streamInfo, setStreamInfo] = useState(null);
  
  // New refs for handling continuous playback
  const watchdogTimerRef = useRef(null);
  const lastPlayPositionRef = useRef(0);
  const stuckCounterRef = useRef(0);
  
  const resetPlayer = () => {
    const video = videoRef.current;
    if (!video) return;
    
    // Clear watchdog timer
    if (watchdogTimerRef.current) {
      clearInterval(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    
    // Reset stuck detection counters
    lastPlayPositionRef.current = 0;
    stuckCounterRef.current = 0;
    
    // Cleanup existing players
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    if (mpegtsRef.current) {
      mpegtsRef.current.destroy();
      mpegtsRef.current = null;
    }
    
    // Reset video element
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch (e) {
      console.warn('Error resetting video element:', e);
    }
    
    setActivePlayerType(null);
  };
  
  const addTimestampToUrl = (url) => {
    const timestamp = Date.now();
    if (url.includes('?')) {
      if (url.includes('_t=')) {
        return url.replace(/(_t=)[^&]+/, `$1${timestamp}`);
      }
      return `${url}&_t=${timestamp}`;
    }
    return `${url}?_t=${timestamp}`;
  };
  
  // Setup watchdog to detect and fix stalled playback
  const setupPlaybackWatchdog = () => {
    // Clear any existing watchdog first
    if (watchdogTimerRef.current) {
      clearInterval(watchdogTimerRef.current);
    }
    
    const video = videoRef.current;
    if (!video) return;
    
    // Reset stuck detection
    lastPlayPositionRef.current = video.currentTime;
    stuckCounterRef.current = 0;
    
    // Start a watchdog timer that checks if the video is still playing
    watchdogTimerRef.current = setInterval(() => {
      const currentPlayer = activePlayerType;
      
      if (!video || video.paused || loading) {
        return; // Don't check if video is paused or loading
      }
      
      // Check if current time has changed
      const currentTime = video.currentTime;
      const lastPosition = lastPlayPositionRef.current;
      
      // If we're at the end of the buffer or time hasn't changed
      if (currentTime === lastPosition) {
        stuckCounterRef.current++;
        console.log(`Playback may be stalled: ${stuckCounterRef.current} checks without time change`);
        
        // If we detect no movement for 5 consecutive checks (5 seconds), take action
        if (stuckCounterRef.current >= 5) {
          console.warn('Playback appears to be stalled, attempting to recover');
          
          // Different recovery strategies based on player type
          if (currentPlayer === 'hls' && hlsRef.current) {
            // For HLS: Try to recover the stream
            console.log('Attempting HLS stream recovery');
            hlsRef.current.startLoad();
            
            // Force time update to restart playback
            const smallSeek = Math.max(0, currentTime - 0.1);
            video.currentTime = smallSeek;
            video.play().catch(e => console.warn('Auto-recovery play prevented:', e));
          } 
          else if (currentPlayer === 'mpegts' && mpegtsRef.current) {
            // For mpegts: Try to perform a micro-seek
            console.log('Attempting mpegts stream recovery');
            const smallSeek = Math.max(0, currentTime - 0.1);
            video.currentTime = smallSeek;
            video.play().catch(e => console.warn('Auto-recovery play prevented:', e));
          }
          else if (currentPlayer === 'direct') {
            // For direct: Try a micro-seek
            console.log('Attempting direct stream recovery');
            const smallSeek = Math.max(0, currentTime - 0.1);
            video.currentTime = smallSeek;
            video.play().catch(e => console.warn('Auto-recovery play prevented:', e));
          }
          
          // If we've tried recovery multiple times, show a semi-transparent message
          if (stuckCounterRef.current >= 15) {
            // After multiple consecutive stalls, reload the stream completely
            console.warn('Multiple recovery attempts failed, reloading stream');
            handleTryAgain();
            return;
          }
        }
      } else {
        // Reset counter if video is progressing
        stuckCounterRef.current = 0;
      }
      
      // Update the last position
      lastPlayPositionRef.current = currentTime;
      
    }, 1000); // Check every second
  };
  
  const loadStream = async () => {
    if (!currentChannel?.url || !videoRef.current) return;
    
    // Start fresh
    resetPlayer();
    setLoading(true);
    setError(null);
    
    const video = videoRef.current;
    const url = addTimestampToUrl(currentChannel.url);
    
    console.log(`Loading stream: ${url}`);
    
    // Determine the best player to use based on URL format
    const isHLS = url.includes('.m3u8');
    const isTS = url.includes('.ts');
    const isFrench = (currentChannel?.name?.toLowerCase().includes('france') || 
                      currentChannel?.name?.toLowerCase().includes(' fr') ||
                      currentChannel?.group?.toLowerCase().includes('france'));
    
    let playerToUse = 'direct';
    
    // Strategy: Use mpegts.js for TS streams, HLS.js for m3u8, and direct for others
    // With special handling for French channels that often work better with mpegts
    if (isTS || (isFrench && mpegts.isSupported())) {
      playerToUse = 'mpegts';
    } else if (isHLS && Hls.isSupported()) {
      playerToUse = 'hls';
    }
    
    setStreamInfo({
      url,
      format: isHLS ? 'HLS' : isTS ? 'TS' : 'Unknown',
      french: isFrench,
      suggested: playerToUse
    });
    
    try {
      // Start with the appropriate player
      if (playerToUse === 'mpegts') {
        await loadWithMpegTS(url, video);
      } else if (playerToUse === 'hls') {
        await loadWithHLS(url, video);
      } else {
        await loadDirect(url, video);
      }
      
      // Start the watchdog to monitor playback
      setupPlaybackWatchdog();
      
    } catch (e) {
      console.error('Initial player setup failed:', e);
      setError(`Failed to initialize player: ${e.message}`);
      setLoading(false);
    }
  };
  
  const loadWithMpegTS = async (url, videoElement) => {
    console.log('Loading stream with mpegts.js');
    setActivePlayerType('mpegts');
    
    if (!mpegts.isSupported()) {
      throw new Error('mpegts.js is not supported in this browser');
    }
    
    // Configure mpegts player with continuous playback settings
    const player = mpegts.createPlayer({
      type: 'mpegts',
      url: url,
      isLive: true,
      enableWorker: true,
      enableStashBuffer: true,
      stashInitialSize: 1024 * 512, // 512KB buffer
      // Critical for continuous playback:
      liveBufferLatencyChasing: true,
      liveBufferLatencyMinRemain: 0.1, // Very low latency to prevent ending
      lazyLoad: false,
      autoCleanupSourceBuffer: true, // Auto cleanup to prevent memory issues
      // Increase fragment request timeout
      seekType: 'range',
      cors: true
    });
    
    mpegtsRef.current = player;
    
    return new Promise((resolve, reject) => {
      // Set up event listeners
      player.on(mpegts.Events.ERROR, (errorType, details) => {
        console.error('mpegts error:', errorType, details);
        
        // Only show error if it's still the active player
        if (mpegtsRef.current === player && activePlayerType === 'mpegts') {
          setError(`Stream error: ${errorType}`);
          setLoading(false);
          reject(new Error(`mpegts error: ${errorType}`));
        }
      });
      
      player.on(mpegts.Events.STATISTICS_INFO, () => {
        // We're receiving data, playback should be working
        setLoading(false);
        resolve();
      });
      
      // Add this for live state transitions
      player.on(mpegts.Events.MEDIA_INFO, (mediaInfo) => {
        console.log('Media Info:', mediaInfo);
        if (mediaInfo.mimeType && (mediaInfo.hasVideo || mediaInfo.hasAudio)) {
          setLoading(false);
          resolve();
        }
      });
      
      player.attachMediaElement(videoElement);
      player.load();
      
      // Some streams don't send statistics events, so set a fallback
      setTimeout(() => {
        if (loading && activePlayerType === 'mpegts') {
          console.log('mpegts.js started without statistics event');
          setLoading(false);
          resolve();
        }
      }, 5000);
      
      // Start playback
      videoElement.play().catch(e => {
        console.warn('Autoplay failed, manual play required:', e);
      });
    });
  };
  
  const loadWithHLS = async (url, videoElement) => {
    console.log('Loading stream with HLS.js');
    setActivePlayerType('hls');
    
    if (!Hls.isSupported()) {
      throw new Error('HLS.js is not supported in this browser');
    }
    
    // Create and configure HLS player with options for continuous playback
    const hls = new Hls({
      maxBufferSize: 60 * 1000 * 1000, // 60MB
      maxBufferLength: 120, // Buffer up to 120 seconds
      liveSyncDurationCount: 3, // Use 3 segments for synchronization
      enableWorker: true,
      lowLatencyMode: false, // Disable low latency mode for more stable playback
      // Critical settings for continuous playback:
      liveDurationInfinity: true, // Treat as infinite duration
      liveBackBufferLength: 0, // Don't discard played segments
      backBufferLength: 90, // Keep 90 seconds of back buffer
      fragLoadingTimeOut: 20000, 
      manifestLoadingTimeOut: 20000,
      // Stream continuity flags
      appendErrorMaxRetry: 5, // Retry appending segments multiple times
      levelLoadingRetryDelay: 500, // Retry loading levels quickly
      fragLoadingRetryDelay: 500 // Retry loading fragments quickly
    });
    is
    hlsRef.current = hls;
    
    return new Promise((resolve, reject) => {
      // Set up event listeners
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('HLS media attached');
      });
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');
        setLoading(false);
        
        // Start playback
        videoElement.play().catch(e => {
          console.warn('Autoplay failed, manual play required:', e);
        });
        
        resolve();
      });
      
      // This is critical for handling live stream updates
      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        console.log('HLS level loaded', data);
        
        // Force continual loading of new segments
        if (data.details.live) {
          if (data.details.endSN) {
            hls.loadLevel = data.level; // Ensure we keep loading the active level
          }
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.log('HLS error:', data.type, data.details);
        
        if (data.fatal) {
          console.error('Fatal HLS error:', data.type, data.details);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              // For unrecoverable errors, show message and reject promise
              if (hlsRef.current === hls && activePlayerType === 'hls') {
                setError(`Stream error: ${data.details}`);
                setLoading(false);
                reject(new Error(`HLS error: ${data.details}`));
              }
              break;
          }
        }
        // For non-fatal errors, we still want to know about them
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        }
      });
      
      // Load source and attach to video element
      hls.loadSource(url);
      hls.attachMedia(videoElement);
      
      // Set a timeout in case manifest never loads
      setTimeout(() => {
        if (loading && activePlayerType === 'hls') {
          console.log('HLS timed out, trying alternate method');
          setLoading(false);
          reject(new Error('HLS loading timeout'));
        }
      }, 15000);
    });
  };
  
  const loadDirect = async (url, videoElement) => {
    console.log('Loading stream directly');
    setActivePlayerType('direct');
    
    return new Promise((resolve, reject) => {
      const onError = (e) => {
        console.error('Direct playback error:', e);
        if (activePlayerType === 'direct') {
          setError('This stream format is not supported by your browser.');
          setLoading(false);
          reject(new Error('Direct playback error'));
        }
      };
      
      const onPlaying = () => {
        console.log('Direct playback started');
        setLoading(false);
        resolve();
        
        // Clean up after we've resolved
        videoElement.removeEventListener('playing', onPlaying);
      };
      
      // Add these to monitor end of stream conditions
      const onEnded = () => {
        console.log('Stream ended event fired');
        // For live streams this shouldn't happen - restart the stream
        if (activePlayerType === 'direct') {
          // Add a short delay before reloading
          setTimeout(() => {
            console.log('Auto-reloading stream after ended event');
            videoElement.src = addTimestampToUrl(url);
            videoElement.load();
            videoElement.play().catch(e => {
              console.warn('Auto-restart play prevented:', e);
            });
          }, 500);
        }
      };
      
      const onWaiting = () => {
        console.log('Stream waiting for data');
      };
      
      // Set up event listeners
      videoElement.addEventListener('error', onError);
      videoElement.addEventListener('playing', onPlaying);
      videoElement.addEventListener('ended', onEnded);
      videoElement.addEventListener('waiting', onWaiting);
      
      // Set the source and attempt playback
      videoElement.src = url;
      videoElement.load();
      
      // Attempt to play
      videoElement.play().catch(e => {
        console.warn('Autoplay failed, manual play required:', e);
      });
      
      // Set a timeout
      setTimeout(() => {
        if (loading && activePlayerType === 'direct') {
          videoElement.removeEventListener('playing', onPlaying);
          setLoading(false);
          reject(new Error('Direct playback timeout'));
        }
      }, 15000);
      
      // Return cleanup function
      return () => {
        videoElement.removeEventListener('error', onError);
        videoElement.removeEventListener('playing', onPlaying);
        videoElement.removeEventListener('ended', onEnded);
        videoElement.removeEventListener('waiting', onWaiting);
      };
    });
  };
  
  const tryAlternateFormat = async () => {
    if (!currentChannel?.url) return;
    
    setLoading(true);
    setError(null);
    
    const originalUrl = currentChannel.url;
    let alternateUrl;
    
    // Convert between formats
    if (originalUrl.includes('.ts')) {
      alternateUrl = originalUrl.replace('.ts', '.m3u8');
      console.log('Trying M3U8 format instead of TS');
    } else if (originalUrl.includes('.m3u8')) {
      alternateUrl = originalUrl.replace('.m3u8', '.ts');
      console.log('Trying TS format instead of M3U8');
    } else if (originalUrl.includes('/live/')) {
      // Some providers use alternate paths
      alternateUrl = originalUrl.replace('/live/', '/play/');
      console.log('Trying alternate path: /play/ instead of /live/');
    } else {
      // Add timestamp as last resort
      alternateUrl = addTimestampToUrl(originalUrl);
      console.log('No format change possible, refreshing URL');
    }
    
    // Reset current player
    resetPlayer();
    
    // Get the video element
    const video = videoRef.current;
    if (!video) {
      setError('Video player not available');
      setLoading(false);
      return;
    }
    
    try {
      // Try with the new format but switch player type
      const currentType = activePlayerType;
      
      if (currentType === 'mpegts' || currentType === null) {
        // Try HLS or direct instead
        if (Hls.isSupported() && (alternateUrl.includes('.m3u8') || !alternateUrl.includes('.ts'))) {
          await loadWithHLS(alternateUrl, video);
        } else {
          await loadDirect(alternateUrl, video);
        }
      } else if (currentType === 'hls') {
        // Try mpegts or direct instead
        if (mpegts.isSupported() && alternateUrl.includes('.ts')) {
          await loadWithMpegTS(alternateUrl, video);
        } else {
          await loadDirect(alternateUrl, video);
        }
      } else {
        // If direct failed, try mpegts or hls based on url
        if (mpegts.isSupported() && alternateUrl.includes('.ts')) {
          await loadWithMpegTS(alternateUrl, video);
        } else if (Hls.isSupported() && alternateUrl.includes('.m3u8')) {
          await loadWithHLS(alternateUrl, video);
        } else {
          setError('No compatible playback method available for this stream');
          setLoading(false);
        }
      }
      
      // Start the watchdog to monitor playback
      setupPlaybackWatchdog();
    } catch (e) {
      console.error('Failed to load with alternate format:', e);
      setError('Failed to play with alternate format. The stream may be offline.');
      setLoading(false);
    }
  };
  
  const handleTryAgain = () => {
    loadStream();
  };
  
  // Load stream when channel changes
  useEffect(() => {
    if (currentChannel) {
      loadStream();
    }
    
    return () => {
      resetPlayer();
    };
  }, [currentChannel]);
  
  if (!currentChannel) {
    return (
      <div className="no-channel">
        <p>Select a channel to start watching</p>
      </div>
    );
  }
  
  return (
    <div className="player-container">
      <div className="channel-info">
        {currentChannel.logo && (
          <img 
            src={currentChannel.logo}
            alt={currentChannel.name}
            className="channel-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div>
          <h2>{currentChannel.name}</h2>
          {currentChannel.group && (
            <p className="channel-group">{currentChannel.group}</p>
          )}
        </div>
      </div>
      
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="main-video-player"
          controls
          autoPlay
          playsInline
        />
        
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading stream...</p>
            {activePlayerType && <p className="player-type">Using {activePlayerType} player</p>}
          </div>
        )}
        
        {error && (
          <div className="error-overlay">
            <div className="error-icon">⚠️</div>
            <p className="error-message">{error}</p>
            <div className="error-buttons">
              <button onClick={handleTryAgain} className="btn-retry">
                Try Again
              </button>
              <button onClick={tryAlternateFormat} className="btn-alternate">
                Try Different Format
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="player-controls">
        <button onClick={handleTryAgain} className="btn-reload">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 9h7V2l-2.35 4.35z"/>
          </svg>
          Reload Stream
        </button>
        <button onClick={tryAlternateFormat} className="btn-format">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/>
          </svg>
          Try Alternate Format
        </button>
      </div>
      
      {streamInfo && (
        <div className="stream-debug">
          <details>
            <summary>Stream Information</summary>
            <div className="stream-details">
              <p><strong>Format:</strong> {streamInfo.format}</p>
              <p><strong>Player:</strong> {activePlayerType || 'Not started'}</p>
              <p><strong>French content:</strong> {streamInfo.french ? 'Yes' : 'No'}</p>
              <p><strong>Auto-recovery:</strong> Enabled (checks every second)</p>
            </div>
          </details>
        </div>
      )}
      
      <style jsx>{`
        .player-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #000;
          color: white;
        }

        /* Other styles same as before */

        .channel-info {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          background: rgba(0,0,0,0.8);
        }
        
        .channel-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
          margin-right: 15px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
        }
        
        .channel-info h2 {
          margin: 0;
          font-size: 1.2rem;
        }
        
        .channel-group {
          margin: 5px 0 0;
          opacity: 0.7;
          font-size: 0.85rem;
        }
        
        .video-wrapper {
          flex: 1;
          position: relative;
          background: #000;
          aspect-ratio: 16 / 9;
          max-height: calc(100vh - 180px);
        }
        
        .main-video-player {
          width: 100%;
          height: 100%;
          background: #000;
        }
        
        .loading-overlay, .error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.7);
          z-index: 10;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        
        .player-type {
          font-size: 0.8rem;
          opacity: 0.7;
          margin-top: 10px;
        }
        
        .error-icon {
          font-size: 2.5rem;
          margin-bottom: 10px;
        }
        
        .error-message {
          text-align: center;
          max-width: 80%;
          margin-bottom: 20px;
        }
        
        .error-buttons {
          display: flex;
          gap: 10px;
        }
        
        .player-controls {
          display: flex;
          padding: 10px;
          background: rgba(0,0,0,0.8);
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .player-controls button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
          transition: background 0.2s;
        }
        
        .player-controls button:hover {
          background: rgba(255,255,255,0.2);
        }
        
        .btn-retry, .btn-alternate {
          background: rgba(255,255,255,0.15);
          border: none;
          color: white;
          padding: 10px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-retry {
          background-color: #2196F3;
        }
        
        .btn-alternate {
          background-color: rgba(255,255,255,0.2);
        }
        
        .stream-debug {
          padding: 10px;
          font-size: 0.85rem;
          background: rgba(0,0,0,0.7);
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .stream-debug summary {
          cursor: pointer;
          color: #ccc;
          user-select: none;
        }
        
        .stream-details {
          margin-top: 10px;
          padding: 10px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        
        .stream-details p {
          margin: 5px 0;
        }
        
        .no-channel {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
          background: #111;
          font-size: 1.1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
