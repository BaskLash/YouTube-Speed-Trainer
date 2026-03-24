// YouTube Speed Trainer - Popup Script

const DEFAULTS = {
  currentSpeed: 1.0,
  increment: 0.05,
  minSpeed: 0.5,
  maxSpeed: 4.0
};

let currentState = {
  speed: DEFAULTS.currentSpeed,
  increment: DEFAULTS.increment,
  isOnYouTube: false,
  tabId: null
};

// Update speed display
function updateSpeedDisplay(speed) {
  const speedInt = document.getElementById('speed-int');
  const speedDec = document.getElementById('speed-dec');
  
  const intPart = Math.floor(speed);
  const decPart = Math.round((speed - intPart) * 100);
  
  speedInt.textContent = intPart;
  speedDec.textContent = decPart.toString().padStart(2, '0');
}

// Update increment buttons
function updateIncrementButtons(activeIncrement) {
  document.querySelectorAll('.increment-btn').forEach(btn => {
    const value = parseFloat(btn.dataset.value);
    btn.classList.toggle('active', Math.abs(value - activeIncrement) < 0.001);
  });
}

// Update status indicator
function updateStatus(isOnYouTube, isPlaying, statusMessage) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  
  if (isOnYouTube) {
    dot.classList.add('active');
    text.textContent = statusMessage || (isPlaying ? 'Playing' : 'Ready');
  } else {
    dot.classList.remove('active');
    text.textContent = statusMessage || 'Not on YouTube';
  }
}

// Check if URL is a YouTube page (improved detection)
function isYouTubeUrl(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    // Match youtube.com, www.youtube.com, m.youtube.com, music.youtube.com
    return hostname === 'youtube.com' || 
           hostname.endsWith('.youtube.com');
  } catch {
    return false;
  }
}

// Inject content script if needed (for cases where page loaded before extension)
async function ensureContentScriptInjected(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    // Wait a bit for the script to initialize
    await new Promise(r => setTimeout(r, 100));
    return true;
  } catch (e) {
    console.log('Could not inject content script:', e.message);
    return false;
  }
}

// Send message to content script with retry and auto-injection
async function sendToContent(message, retries = 3) {
  if (!currentState.tabId) {
    return null;
  }
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(currentState.tabId, message);
      return response;
    } catch (e) {
      console.log(`Attempt ${attempt + 1} failed:`, e.message);
      
      if (attempt === 0 && currentState.isOnYouTube) {
        // First failure - try to inject content script
        await ensureContentScriptInjected(currentState.tabId);
      } else if (attempt < retries) {
        // Wait and retry
        await new Promise(r => setTimeout(r, 150 * (attempt + 1)));
      }
    }
  }
  return null;
}

// Load state from storage and content script
async function loadState() {
  // Get the active tab first
  let tab;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = tabs[0];
  } catch (e) {
    console.error('Failed to query tabs:', e);
    updateStatus(false, false, 'Extension error');
    loadFromStorage();
    return;
  }
  
  if (!tab) {
    updateStatus(false, false, 'No active tab');
    loadFromStorage();
    return;
  }
  
  // Store tab ID
  currentState.tabId = tab.id;
  
  // Check if we're on YouTube using the URL
  // Note: tab.url requires "tabs" permission in manifest
  const url = tab.url || '';
  const onYouTube = isYouTubeUrl(url);
  currentState.isOnYouTube = onYouTube;
  
  console.log('Tab URL:', url, 'Is YouTube:', onYouTube);
  
  if (!onYouTube) {
    updateStatus(false, false);
    loadFromStorage();
    return;
  }
  
  // We're on YouTube - try to get state from content script
  updateStatus(true, false, 'Connecting...');
  
  const contentState = await sendToContent({ type: 'GET_STATE' });
  
  if (contentState) {
    currentState.speed = contentState.currentSpeed;
    currentState.increment = contentState.increment;
    updateSpeedDisplay(currentState.speed);
    updateIncrementButtons(currentState.increment);
    updateStatus(true, contentState.isPlaying, contentState.hasVideo ? (contentState.isPlaying ? 'Playing' : 'Ready') : 'No video');
  } else {
    // Content script not responding - load from storage but show as on YouTube
    loadFromStorage();
    updateStatus(true, false, 'Refresh page to activate');
  }
}

// Load from storage (fallback)
function loadFromStorage() {
  chrome.storage.local.get(['currentSpeed', 'increment'], (result) => {
    currentState.speed = result.currentSpeed ?? DEFAULTS.currentSpeed;
    currentState.increment = result.increment ?? DEFAULTS.increment;
    updateSpeedDisplay(currentState.speed);
    updateIncrementButtons(currentState.increment);
  });
}

// Change speed - applies instantly
async function changeSpeed(delta) {
  const newSpeed = Math.max(
    DEFAULTS.minSpeed,
    Math.min(DEFAULTS.maxSpeed, currentState.speed + delta)
  );
  
  // Round to avoid floating point issues
  const roundedSpeed = Math.round(newSpeed * 100) / 100;
  
  if (roundedSpeed === currentState.speed) return;
  
  currentState.speed = roundedSpeed;
  updateSpeedDisplay(roundedSpeed);
  
  // Update in storage first (always works)
  chrome.storage.local.set({ currentSpeed: roundedSpeed });
  
  // Update content script immediately if on YouTube
  if (currentState.isOnYouTube && currentState.tabId) {
    const response = await sendToContent({ type: 'SET_SPEED', speed: roundedSpeed });
    if (response?.success) {
      console.log(`Speed updated to ${roundedSpeed}x (actual: ${response.actualSpeed}x)`);
      updateStatus(true, true, `Speed: ${roundedSpeed.toFixed(2)}×`);
      // Reset status after a moment
      setTimeout(() => updateStatus(true, true, 'Playing'), 1000);
    } else {
      console.log('Speed saved but content script not responding');
      updateStatus(true, false, 'Speed saved (refresh to apply)');
    }
  }
}

// Set increment
async function setIncrement(value) {
  currentState.increment = value;
  updateIncrementButtons(value);
  
  // Update in storage
  chrome.storage.local.set({ increment: value });
  
  // Update content script
  if (currentState.isOnYouTube && currentState.tabId) {
    await sendToContent({ type: 'SET_INCREMENT', increment: value });
  }
}

// Reset to defaults
async function reset() {
  currentState.speed = DEFAULTS.currentSpeed;
  currentState.increment = DEFAULTS.increment;
  
  updateSpeedDisplay(DEFAULTS.currentSpeed);
  updateIncrementButtons(DEFAULTS.increment);
  
  // Update storage
  chrome.storage.local.set({
    currentSpeed: DEFAULTS.currentSpeed,
    increment: DEFAULTS.increment
  });
  
  // Update content script
  if (currentState.isOnYouTube && currentState.tabId) {
    await sendToContent({ type: 'RESET' });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  
  // Speed buttons
  document.getElementById('btn-decrease').addEventListener('click', () => {
    changeSpeed(-currentState.increment);
  });
  
  document.getElementById('btn-increase').addEventListener('click', () => {
    changeSpeed(currentState.increment);
  });
  
  // Increment buttons
  document.querySelectorAll('.increment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = parseFloat(btn.dataset.value);
      setIncrement(value);
    });
  });
  
  // Reset button
  document.getElementById('btn-reset').addEventListener('click', reset);
});
