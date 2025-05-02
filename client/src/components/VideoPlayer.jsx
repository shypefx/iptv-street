// src/components/VideoPlayer.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import mpegts from 'mpegts.js';
import '../styles/VideoPlayer.css';

// Configure mpegts.js globally - enable minimal logging
mpegts.LoggingControl.enableVerbose = false;
mpegts.LoggingControl.enableInfo = false;
mpegts.LoggingControl.enableDebug = false;

const VideoPlayer = ({ channel }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const bufferingTimer = useRef(null);
  
  // Function to get stream URL
  const getStreamUrl = useCallback((channel) => {
    if (!channel) return null;
    
    try {
      // Get credentials from localStorage
      const credentials = JSON.parse(localStorage.getItem('xtreme_credentials') || '{}');
      const { serverUrl, username, password } = credentials;
      
      if (!serverUrl || !username || !password) {
        console.error("Missing credentials");
        return null;
      }
      
      const streamId = channel.stream_id || channel.id;
      if (!streamId) {
        console.error("No stream ID found", channel);
        return null;
      }
      
      // Try TS format first (better compatibility with mpegts.js)
      return `${serverUrl}/live/${username}/${password}/${streamId}.ts`;
    } catch (e) {
      console.error("Error getting stream URL:", e);
      return null;
    }
  }, []);

  // Cleanup player
  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
        console.log("Player destroyed");
      } catch (e) {
        console.error("Error destroying player:", e);
      }
      playerRef.current = null;
    }
    
    // Clear any buffering timers
    if (bufferingTimer.current) {
      clearTimeout(bufferingTimer.current);
      bufferingTimer.current = null;
    }
  }, []);
  
  // Try alternative formats if main one fails
  const tryAlternativeUrl = useCallback((originalUrl) => {
    if (!originalUrl) return null;
    
    // If TS fails, try m3u8
    if (originalUrl.endsWith('.ts')) {
      return originalUrl.replace('.ts', '.m3u8');
    }
    
    // If m3u8 fails, try TS
    if (originalUrl.endsWith('.m3u8')) {
      return originalUrl.replace('.m3u8', '.ts');
    }
    
    return null;
  }, []);

  // Performance optimization: Recreate player when frequent buffering is detected
  const handleBufferingIssues = useCallback(() => {
    if (isBuffering && playerRef.current) {
      console.log("Attempting to resolve buffering by recreating player");
      
      // Get current time to resume from
      const currentTime = videoRef.current?.currentTime || 0;
      const streamUrl = getStreamUrl(channel);
      
      // Destroy and recreate player
      destroyPlayer();
      
      // Create new player with more aggressive settings
      setTimeout(() => {
        try {
          playerRef.current = mpegts.createPlayer({
            type: 'mse',
            isLive: true,
            url: streamUrl,
            cors: true,
            withCredentials: false,
            userConfig: {
              enableWorker: true,
              lazyLoad: false,
              // Reduced buffer size for less latency
              stashInitialSize: 128 * 1024,  // Smaller initial buffer (128KB)
              enableStashBuffer: true,
              liveBufferLatencyChasing: true,
              liveStackSize: 30,  // Reduce stack size
              // Aggressive latency settings
              liveBufferLatencyMaxLatency: 2.5,  // 2.5 seconds max latency
              liveBufferLatencyMinRemain: 0.5,   // 0.5 seconds min remain
              liveSync: true,
              // Faster segment loading
              progressiveSegmentSize: 64 * 1024, // 64KB progressive segments
              // Skip frames if needed
              renderDropFrames: true,
              // Lower video quality for performance
              forceDropFrameRate: 5, // Drop frames if performance issues
            }
          });
          
          playerRef.current.attachMediaElement(videoRef.current);
          playerRef.current.load();
          playerRef.current.play().catch(e => {
            console.error("Auto-play failed after buffering fix", e);
          });
          
          // Try to restore position
          if (currentTime > 0) {
            videoRef.current.currentTime = currentTime;
          }
          
          setIsBuffering(false);
        } catch (e) {
          console.error("Error recreating player after buffering:", e);
        }
      }, 500);
    }
  }, [isBuffering, channel, destroyPlayer, getStreamUrl]);

  // Initialize or update player when channel changes
  useEffect(() => {
    console.log("Channel changed, initializing player", channel?.name);
    setLoading(true);
    setError(null);
    setIsBuffering(false);
    
    // Check if mpegts.js is supported
    if (!mpegts.isSupported()) {
      setError("Your browser does not support mpegts.js");
      setLoading(false);
      return;
    }
    
    // Get stream URL
    const streamUrl = getStreamUrl(channel);
    if (!streamUrl) {
      setError("Failed to get stream URL");
      setLoading(false);
      return;
    }
    
    console.log("Initializing player with URL:", streamUrl);
    setDebugInfo(prev => ({ ...prev, streamUrl }));
    
    // Clean up previous player
    destroyPlayer();
    
    // Allow DOM to update
    const initTimeout = setTimeout(() => {
      if (!videoRef.current) {
        console.error("Video element not found");
        setError("Cannot initialize video player");
        setLoading(false);
        return;
      }
      
      try {
        // Initialize mpegts.js player with optimized settings
        playerRef.current = mpegts.createPlayer({
          type: 'mse',
          isLive: true,
          url: streamUrl,
          cors: true,
          withCredentials: false,
          userConfig: {
            enableWorker: true,
            lazyLoad: false,
            // Latency optimization
            liveBufferLatencyChasing: true,
            // Smaller buffer to reduce latency
            stashInitialSize: 256 * 1024,  // 256KB initial cache
            enableStashBuffer: true,
            autoCleanupSourceBuffer: true,
            // Better settings for live TV
            reuseRedirectedUrl: true,
            fixAudioTimestampGap: true,
            // Skip seeking for live content
            accurateSeek: false,
            seekType: 'range',
            // Latency settings
            liveBufferLatencyMaxLatency: 3.0,  // 3 seconds max latency
            liveBufferLatencyMinRemain: 0.5,   // 0.5 seconds min remain
            // High performance settings
            liveSync: true,
            // Skip frames if needed to maintain playback
            renderDropFrames: true
          }
        });

        // Attach player to video element
        playerRef.current.attachMediaElement(videoRef.current);
        
        // Setup event listeners
        playerRef.current.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
          console.error(`Player error: ${errorType}, ${errorDetail}`, errorInfo);
          setDebugInfo(prev => ({ 
            ...prev, 
            errorType, 
            errorDetail: JSON.stringify(errorDetail),
            errorInfo: JSON.stringify(errorInfo)
          }));
          
          // Try alternative URL if this is a network error
          if (errorType === mpegts.ErrorTypes.NETWORK_ERROR) {
            const altUrl = tryAlternativeUrl(streamUrl);
            if (altUrl) {
              console.log("Trying alternative URL:", altUrl);
              setDebugInfo(prev => ({ ...prev, altUrl }));
              
              // Retry with alternative URL
              destroyPlayer();
              setTimeout(() => {
                try {
                  playerRef.current = mpegts.createPlayer({
                    type: 'mse',
                    isLive: true,
                    url: altUrl,
                    cors: true,
                    userConfig: {
                      enableWorker: true,
                      stashInitialSize: 256 * 1024,  // Smaller buffer
                      liveBufferLatencyMaxLatency: 3.0,
                      liveBufferLatencyMinRemain: 0.5,
                      liveSync: true
                    }
                  });
                  playerRef.current.attachMediaElement(videoRef.current);
                  playerRef.current.load();
                  playerRef.current.play();
                } catch (e) {
                  console.error("Error with alternative URL:", e);
                  setError("Stream playback failed. Please try another channel.");
                  setLoading(false);
                }
              }, 500);
              return;
            }
          }
          
          setError("Stream playback error. Please try another channel.");
          setLoading(false);
        });

        playerRef.current.on(mpegts.Events.LOADING_COMPLETE, () => {
          console.log("Loading complete");
          setDebugInfo(prev => ({ ...prev, loadingComplete: true }));
        });

        playerRef.current.on(mpegts.Events.RECOVERED_EARLY_EOF, () => {
          console.log("Recovered from early EOF");
          setDebugInfo(prev => ({ ...prev, recoveredEof: true }));
        });

        playerRef.current.on(mpegts.Events.MEDIA_INFO, (mediaInfo) => {
          console.log("Media info:", mediaInfo);
          setDebugInfo(prev => ({ ...prev, mediaInfo: JSON.stringify(mediaInfo) }));
          
          // Set video quality based on connection
          if (navigator.connection) {
            const connection = navigator.connection;
            const isSlowConnection = connection.downlink < 5 || connection.rtt > 100;
            
            if (isSlowConnection) {
              console.log("Slow connection detected, optimizing for performance");
              playerRef.current.configureConfig({
                stashInitialSize: 128 * 1024,  // Even smaller buffer for slow connections
                liveBufferLatencyMaxLatency: 1.5,  // Lower latency target
                forceDropFrameRate: 10  // More aggressive frame dropping
              });
            }
          }
        });

        // Handle buffering events
        playerRef.current.on(mpegts.Events.STATISTICS_INFO, (statisticsInfo) => {
          // Check buffer health
          if (statisticsInfo && statisticsInfo.playerType === 'mse') {
            const { videoBufferBytes, audioBufferBytes } = statisticsInfo;
            const totalBufferSize = (videoBufferBytes || 0) + (audioBufferBytes || 0);
            
            // If buffer is getting low, mark as buffering
            if (totalBufferSize < 100 * 1024) { // Less than 100KB buffer
              if (!isBuffering) {
                console.log("Low buffer detected:", totalBufferSize);
                setIsBuffering(true);
                
                // Set timer to recover from extended buffering
                if (bufferingTimer.current) {
                  clearTimeout(bufferingTimer.current);
                }
                
                bufferingTimer.current = setTimeout(() => {
                  handleBufferingIssues();
                }, 5000); // Wait 5 seconds before taking action
              }
            } else if (isBuffering && totalBufferSize > 200 * 1024) {
              // Buffer recovered
              console.log("Buffer recovered:", totalBufferSize);
              setIsBuffering(false);
              
              if (bufferingTimer.current) {
                clearTimeout(bufferingTimer.current);
                bufferingTimer.current = null;
              }
            }
          }
        });

        // Load and play
        playerRef.current.load();
        
        // Start playback after a shorter delay
        setTimeout(() => {
          if (playerRef.current && videoRef.current) {
            console.log("Starting playback");
            try {
              playerRef.current.play();
              setLoading(false);
            } catch (e) {
              console.error("Play error:", e);
              setError("Failed to start playback");
              setLoading(false);
            }
          }
        }, 1000); // Reduced to 1 second
        
      } catch (e) {
        console.error("Error initializing player:", e);
        setError(`Player initialization failed: ${e.message}`);
        setLoading(false);
      }
    }, 300); // Shorter timeout for faster initialization

    // Cleanup function
    return () => {
      clearTimeout(initTimeout);
      destroyPlayer();
    };
  }, [channel, getStreamUrl, destroyPlayer, tryAlternativeUrl, handleBufferingIssues]);

  // Add event listeners to video element
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (!videoElement) return;
    
    const handlePlay = () => {
      console.log("Video started playing");
      setLoading(false);
      
      // Attempt to optimize playback when it starts
      if (videoElement.playbackRate) {
        // Slightly faster playback can help reduce buffering
        videoElement.playbackRate = 1.01;
      }
    };
    
    const handlePause = () => {
      console.log("Video paused");
    };
    
    const handleError = (e) => {
      console.error("Video element error:", e);
      setDebugInfo(prev => ({ 
        ...prev, 
        videoError: e.target.error ? e.target.error.message : "Unknown video error" 
      }));
    };
    
    const handleWaiting = () => {
      console.log("Video waiting for data");
      setLoading(true);
      setIsBuffering(true);
      
      // Set a timer to take action if buffering lasts too long
      if (bufferingTimer.current) {
        clearTimeout(bufferingTimer.current);
      }
      
      bufferingTimer.current = setTimeout(() => {
        handleBufferingIssues();
      }, 5000); // If buffering lasts more than 5 seconds, take action
    };
    
    const handlePlaying = () => {
      console.log("Video playing");
      setLoading(false);
      setIsBuffering(false);
      
      if (bufferingTimer.current) {
        clearTimeout(bufferingTimer.current);
        bufferingTimer.current = null;
      }
    };
    
    // Add event listeners
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    
    // Add buffering detection via progress events
    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
        const duration = videoElement.duration;
        const bufferedAmount = (bufferedEnd / duration) * 100;
        
        setDebugInfo(prev => ({ 
          ...prev, 
          bufferedPercent: Math.round(bufferedAmount),
          bufferedEnd,
          currentTime: videoElement.currentTime
        }));
      }
    };
    
    videoElement.addEventListener('progress', handleProgress);
    
    // Auto-recover from stalls
    const checkPlayback = setInterval(() => {
      if (videoElement && !videoElement.paused) {
        // Check if video is actually advancing
        const currentTime = videoElement.currentTime;
        
        // Store current time for comparison
        videoElement.dataset.lastTime = videoElement.dataset.lastTime || currentTime;
        
        // If time hasn't advanced for 3 seconds but we're not paused
        if (Math.abs(currentTime - parseFloat(videoElement.dataset.lastTime)) < 0.01 && 
            !videoElement.paused && !isBuffering) {
          console.log("Detected stalled playback, attempting recovery");
          setIsBuffering(true);  
          
          // Try fast recovery first - small seek
          videoElement.currentTime += 0.1;
          
          // If that doesn't work, trigger full recovery
          setTimeout(() => {
            if (Math.abs(videoElement.currentTime - currentTime) < 0.2) {
              handleBufferingIssues();
            }
          }, 1000);
        }
        
        // Update last time
        videoElement.dataset.lastTime = currentTime;
      }
    }, 3000); // Check every 3 seconds
    
    // Cleanup
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('waiting', handleWaiting);
        videoElement.removeEventListener('playing', handlePlaying);
        videoElement.removeEventListener('progress', handleProgress);
      }
      
      clearInterval(checkPlayback);
      
      if (bufferingTimer.current) {
        clearTimeout(bufferingTimer.current);
        bufferingTimer.current = null;
      }
    };
  }, [isBuffering, handleBufferingIssues]);

  return (
    <div className="video-player">
      {(loading || isBuffering) && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div className="loading-text">
            {loading ? "Loading stream..." : "Buffering..."}
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-info">
              <small>{channel?.name}</small>
              <small>{debugInfo.streamUrl}</small>
              {isBuffering && <small>Buffering: {debugInfo.bufferedPercent}%</small>}
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="error-overlay" onClick={() => setError(null)}>
          <div className="error-message">
            {error}
            <div className="error-tip">Tap to dismiss</div>
            {process.env.NODE_ENV === 'development' && (
              <div className="debug-info">
                <small>{JSON.stringify(debugInfo)}</small>
              </div>
            )}
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="video-element"
        controls
        autoPlay
        playsInline
        onClick={(e) => {
          // Handle click to play/pause
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play().catch(err => 
                console.error("Error on play click:", err)
              );
            } else {
              videoRef.current.pause();
            }
          }
          e.stopPropagation();
        }}
      ></video>
    </div>
  );
};

export default VideoPlayer;
