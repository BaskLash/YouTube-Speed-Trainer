// YouTube Speed Trainer - Content Script
// Handles video speed control and completion tracking

(function() {
  'use strict';

  // Default settings
  const DEFAULTS = {
    currentSpeed: 1.0,
    increment: 0.05,
    minSpeed: 0.5,
    maxSpeed: 4.0,
    completionThreshold: 0.8 // 80% watched = completed
  };

  let state = {
    currentSpeed: DEFAULTS.currentSpeed,
    increment: DEFAULTS.increment,
    videoId: null,
    hasIncrementedForVideo: false,
    lastAppliedSpeed: null
  };

  // Get current video ID from URL
  function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  // Load settings from storage
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['currentSpeed', 'increment'], (result) => {
        state.currentSpeed = result.currentSpeed ?? DEFAULTS.currentSpeed;
        state.increment = result.increment ?? DEFAULTS.increment;
        resolve();
      });
    });
  }

  // Save current speed to storage
  function saveSpeed(speed) {
    state.currentSpeed = speed;
    chrome.storage.local.set({ currentSpeed: speed });
  }

  // Get the video element
  function getVideo() {
    return document.querySelector('video.html5-main-video') || document.querySelector('video');
  }

  // Apply speed to video
  function applySpeed(video) {
    if (!video) return;
    
    const targetSpeed = Math.max(DEFAULTS.minSpeed, Math.min(DEFAULTS.maxSpeed, state.currentSpeed));
    
    if (video.playbackRate !== targetSpeed) {
      video.playbackRate = targetSpeed;
      state.lastAppliedSpeed = targetSpeed;
      console.log(`[Speed Trainer] Speed set to ${targetSpeed.toFixed(2)}x`);
    }
  }

  // Check video completion and increment speed if needed
  function checkCompletion(video) {
    if (!video || state.hasIncrementedForVideo) return;
    
    const progress = video.currentTime / video.duration;
    
    if (progress >= DEFAULTS.completionThreshold && video.duration > 60) {
      // Video is mostly watched and longer than 1 minute
      const newSpeed = Math.min(DEFAULTS.maxSpeed, state.currentSpeed + state.increment);
      
      if (newSpeed !== state.currentSpeed) {
        saveSpeed(newSpeed);
        state.hasIncrementedForVideo = true;
        console.log(`[Speed Trainer] Completed! Next video will play at ${newSpeed.toFixed(2)}x`);
        
        // Show brief notification
        showNotification(`Next video: ${newSpeed.toFixed(2)}×`);
      }
    }
  }

  // Show a brief on-screen notification
  function showNotification(message) {
    // Remove any existing notification
    const existing = document.getElementById('speed-trainer-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'speed-trainer-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #00d4aa;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(0, 212, 170, 0.3);
      border: 1px solid rgba(0, 212, 170, 0.3);
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Handle video change (new video loaded)
  function handleVideoChange() {
    const newVideoId = getVideoId();
    
    if (newVideoId && newVideoId !== state.videoId) {
      state.videoId = newVideoId;
      state.hasIncrementedForVideo = false;
      console.log(`[Speed Trainer] New video detected: ${newVideoId}`);
    }
  }

  // Main update loop
  async function update() {
    handleVideoChange();
    
    const video = getVideo();
    if (video) {
      applySpeed(video);
      checkCompletion(video);
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_STATE') {
      const video = getVideo();
      sendResponse({
        currentSpeed: state.currentSpeed,
        increment: state.increment,
        actualSpeed: video ? video.playbackRate : null,
        isPlaying: video ? !video.paused : false
      });
    } else if (message.type === 'SET_SPEED') {
      const newSpeed = Math.max(DEFAULTS.minSpeed, Math.min(DEFAULTS.maxSpeed, message.speed));
      saveSpeed(newSpeed);
      const video = getVideo();
      if (video) {
        video.playbackRate = newSpeed;
      }
      sendResponse({ success: true, currentSpeed: newSpeed });
    } else if (message.type === 'SET_INCREMENT') {
      state.increment = message.increment;
      chrome.storage.local.set({ increment: message.increment });
      sendResponse({ success: true });
    } else if (message.type === 'RESET') {
      state.currentSpeed = DEFAULTS.currentSpeed;
      state.increment = DEFAULTS.increment;
      chrome.storage.local.set({ 
        currentSpeed: DEFAULTS.currentSpeed, 
        increment: DEFAULTS.increment 
      });
      const video = getVideo();
      if (video) {
        video.playbackRate = DEFAULTS.currentSpeed;
      }
      sendResponse({ success: true });
    }
    return true;
  });

  // Initialize
  async function init() {
    await loadSettings();
    console.log(`[Speed Trainer] Initialized at ${state.currentSpeed.toFixed(2)}x`);
    
    // Run update loop
    setInterval(update, 500);
    
    // Also update on URL changes (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        handleVideoChange();
      }
    }).observe(document.body, { subtree: true, childList: true });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
