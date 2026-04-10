// YouTube Speed Trainer - Content Script
// Supports time-based progression and custom increments

(function() {
  'use strict';

  const DEFAULTS = {
    currentSpeed: 1.0,
    increment: 0.05,
    minSpeed: 0.5,
    maxSpeed: 4.0,
    timeThreshold: 600,    // 10 minutes in seconds
    watchedTime: 0         // Cumulative watch time
  };

  let state = {
    currentSpeed: DEFAULTS.currentSpeed,
    increment: DEFAULTS.increment,
    timeThreshold: DEFAULTS.timeThreshold,
    watchedTime: DEFAULTS.watchedTime,
    videoId: null,
    lastAppliedSpeed: null,
    lastTimeUpdate: null,
    isTracking: false
  };

  // Get current video ID from URL
  function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  // Load settings from storage
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        'currentSpeed', 
        'increment', 
        'timeThreshold', 
        'watchedTime'
      ], (result) => {
        state.currentSpeed = result.currentSpeed ?? DEFAULTS.currentSpeed;
        state.increment = result.increment ?? DEFAULTS.increment;
        state.timeThreshold = result.timeThreshold ?? DEFAULTS.timeThreshold;
        state.watchedTime = result.watchedTime ?? DEFAULTS.watchedTime;
        resolve();
      });
    });
  }

  // Save state to storage
  function saveState() {
    chrome.storage.local.set({
      currentSpeed: state.currentSpeed,
      watchedTime: state.watchedTime
    });
  }

  // Get the video element
  function getVideo() {
    return document.querySelector('video.html5-main-video') 
        || document.querySelector('video.video-stream')
        || document.querySelector('#movie_player video')
        || document.querySelector('video');
  }

  // Check if video is ready to accept playbackRate changes
  function isVideoReady(video) {
    if (!video) return false;
    
    // Video must have metadata loaded (readyState >= 1)
    // AND have a valid duration (not NaN, not 0, not Infinity)
    // AND not be in an error state
    return video.readyState >= 1 && 
           video.duration > 0 && 
           isFinite(video.duration) &&
           !video.error;
  }

  // Apply speed to video (only when safe)
  function applySpeed(video, speed) {
    if (!video) return false;
    
    // CRITICAL: Don't set playbackRate before video is ready
    // This prevents the black screen / initialization bug
    if (!isVideoReady(video)) {
      return false;
    }
    
    const targetSpeed = Math.max(DEFAULTS.minSpeed, Math.min(DEFAULTS.maxSpeed, speed ?? state.currentSpeed));
    
    // Only update if different (avoid unnecessary writes)
    if (Math.abs(video.playbackRate - targetSpeed) > 0.001) {
      video.playbackRate = targetSpeed;
      state.lastAppliedSpeed = targetSpeed;
      console.log(`[Speed Trainer] Speed set to ${targetSpeed.toFixed(2)}x`);
      return true;
    }
    return false;
  }

  // Safely apply speed (used by popup commands)
  // Waits for video to be ready if necessary
  function safeApplySpeed(video, speed, callback) {
    if (!video) {
      callback?.(false, null);
      return;
    }
    
    // If already ready, apply immediately
    if (isVideoReady(video)) {
      video.playbackRate = speed;
      state.lastAppliedSpeed = speed;
      callback?.(true, video.playbackRate);
      return;
    }
    
    // Otherwise, wait for loadedmetadata event
    const handler = () => {
      video.removeEventListener('loadedmetadata', handler);
      // Small delay to ensure YouTube's player is also ready
      setTimeout(() => {
        if (isVideoReady(video)) {
          video.playbackRate = speed;
          state.lastAppliedSpeed = speed;
          callback?.(true, video.playbackRate);
        } else {
          callback?.(false, null);
        }
      }, 100);
    };
    
    video.addEventListener('loadedmetadata', handler);
    
    // Timeout fallback - don't wait forever
    setTimeout(() => {
      video.removeEventListener('loadedmetadata', handler);
      if (isVideoReady(video)) {
        video.playbackRate = speed;
        callback?.(true, video.playbackRate);
      } else {
        callback?.(false, null);
      }
    }, 3000);
  }

  // Format time for display
  function formatTime(seconds) {
    seconds = Math.floor(seconds);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const existing = document.getElementById('speed-trainer-notification');
    if (existing) existing.remove();

    const colors = {
      info: { bg: 'rgba(0, 212, 170, 0.15)', border: 'rgba(0, 212, 170, 0.3)', text: '#00d4aa' },
      success: { bg: 'rgba(0, 212, 170, 0.2)', border: 'rgba(0, 212, 170, 0.5)', text: '#00d4aa' },
      levelup: { bg: 'linear-gradient(135deg, rgba(0, 212, 170, 0.3) 0%, rgba(0, 160, 128, 0.2) 100%)', border: 'rgba(0, 212, 170, 0.6)', text: '#00d4aa' }
    };
    
    const style = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.id = 'speed-trainer-notification';
    notification.innerHTML = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${style.bg};
      color: ${style.text};
      padding: 14px 20px;
      border-radius: 10px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      border: 1px solid ${style.border};
      animation: slideIn 0.3s ease-out;
      backdrop-filter: blur(10px);
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3500);
  }

  // Check if threshold reached and level up
  function checkAndLevelUp() {
    if (state.watchedTime >= state.timeThreshold) {
      const newSpeed = Math.min(DEFAULTS.maxSpeed, state.currentSpeed + state.increment);
      const roundedSpeed = Math.round(newSpeed * 100) / 100;
      
      if (roundedSpeed !== state.currentSpeed) {
        state.currentSpeed = roundedSpeed;
        state.watchedTime = 0; // Reset for next level
        
        saveState();
        
        // Apply new speed immediately
        const video = getVideo();
        if (video) {
          applySpeed(video, roundedSpeed);
        }
        
        showNotification(
          `⚡ Level Up! <span style="font-size: 18px; margin-left: 8px;">${roundedSpeed.toFixed(2)}×</span>`,
          'levelup'
        );
        
        console.log(`[Speed Trainer] 🎉 Level up! New speed: ${roundedSpeed.toFixed(2)}x`);
      } else {
        // Already at max speed
        state.watchedTime = 0;
        saveState();
        showNotification('Maximum speed reached! 🏆', 'success');
      }
    }
  }

  // Track watch time
  function trackWatchTime(video) {
    // Don't track if video isn't ready or isn't playing
    if (!video || !isVideoReady(video) || video.paused || video.ended) {
      state.isTracking = false;
      return;
    }

    const now = Date.now();
    
    if (state.isTracking && state.lastTimeUpdate) {
      // Calculate time elapsed since last update
      const elapsed = (now - state.lastTimeUpdate) / 1000;
      
      // Only count if elapsed time is reasonable (< 2 seconds between updates)
      // This prevents counting time when tab was in background
      if (elapsed > 0 && elapsed < 2) {
        state.watchedTime += elapsed;
        
        // Check for level up
        checkAndLevelUp();
        
        // Save periodically (every ~5 seconds to reduce writes)
        if (Math.floor(state.watchedTime) % 5 === 0) {
          chrome.storage.local.set({ watchedTime: state.watchedTime });
        }
      }
    }
    
    state.lastTimeUpdate = now;
    state.isTracking = true;
  }

  // Handle video change
  function handleVideoChange() {
    const newVideoId = getVideoId();
    
    if (newVideoId && newVideoId !== state.videoId) {
      state.videoId = newVideoId;
      state.isTracking = false;
      state.lastTimeUpdate = null;
      console.log(`[Speed Trainer] New video: ${newVideoId}`);
    }
  }

  // Main update loop
  function update() {
    handleVideoChange();
    
    const video = getVideo();
    if (video) {
      applySpeed(video, state.currentSpeed);
      trackWatchTime(video);

      // 👉 NEU: Speed an Background senden
    chrome.runtime.sendMessage({
      type: "UPDATE_BADGE",
      speed: video.playbackRate
    });
    }
  }

  // Message listener for popup communication
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Speed Trainer] Message:', message.type);
    
    const video = getVideo();
    
    switch (message.type) {
      case 'GET_STATE':
        sendResponse({
          currentSpeed: state.currentSpeed,
          increment: state.increment,
          timeThreshold: state.timeThreshold,
          watchedTime: state.watchedTime,
          actualSpeed: video ? video.playbackRate : null,
          isPlaying: video ? !video.paused : false,
          hasVideo: !!video,
          videoId: state.videoId
        });
        break;
        
      case 'SET_SPEED':
        const newSpeed = Math.max(DEFAULTS.minSpeed, Math.min(DEFAULTS.maxSpeed, message.speed));
        state.currentSpeed = newSpeed;
        chrome.storage.local.set({ currentSpeed: newSpeed });
        
        // Use safe apply - only set if video is ready
        if (video && isVideoReady(video)) {
          video.playbackRate = newSpeed;
          state.lastAppliedSpeed = newSpeed;
          sendResponse({ 
            success: true, 
            currentSpeed: newSpeed, 
            actualSpeed: video.playbackRate 
          });
        } else {
          // Speed saved, will apply when video is ready (via update loop)
          sendResponse({ 
            success: true, 
            currentSpeed: newSpeed, 
            actualSpeed: null,
            pending: true 
          });
        }
        break;
        
      case 'SET_INCREMENT':
        state.increment = message.increment;
        chrome.storage.local.set({ increment: message.increment });
        sendResponse({ success: true });
        break;
        
      case 'SET_TIME_THRESHOLD':
        state.timeThreshold = message.timeThreshold;
        chrome.storage.local.set({ timeThreshold: message.timeThreshold });
        sendResponse({ success: true });
        break;
        
      case 'RESET':
        state.currentSpeed = DEFAULTS.currentSpeed;
        state.increment = DEFAULTS.increment;
        state.timeThreshold = DEFAULTS.timeThreshold;
        state.watchedTime = 0;
        
        chrome.storage.local.set({
          currentSpeed: DEFAULTS.currentSpeed,
          increment: DEFAULTS.increment,
          timeThreshold: DEFAULTS.timeThreshold,
          watchedTime: 0
        });
        
        // Only apply if video is ready
        if (video && isVideoReady(video)) {
          video.playbackRate = DEFAULTS.currentSpeed;
          state.lastAppliedSpeed = DEFAULTS.currentSpeed;
        }
        
        sendResponse({ success: true });
        break;
        
      case 'PING':
        sendResponse({ alive: true, hasVideo: !!video });
        break;
    }
    
    return true;
  });

  // Initialize
  async function init() {
    await loadSettings();
    console.log(`[Speed Trainer] Initialized at ${state.currentSpeed.toFixed(2)}x`);
    console.log(`[Speed Trainer] Time threshold: ${formatTime(state.timeThreshold)}, Watched: ${formatTime(state.watchedTime)}`);
    
    // Run update loop (500ms for smooth tracking)
    setInterval(update, 500);
    
    // Watch for URL changes
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        handleVideoChange();
      }
    }).observe(document.body, { subtree: true, childList: true });
    
    // Save state before page unload
    window.addEventListener('beforeunload', saveState);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
