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
  isOnYouTube: false
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
function updateStatus(isOnYouTube, isPlaying) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  
  if (isOnYouTube) {
    dot.classList.add('active');
    text.textContent = isPlaying ? 'Playing' : 'Ready';
  } else {
    dot.classList.remove('active');
    text.textContent = 'Not on YouTube';
  }
}

// Send message to content script
async function sendToContent(message) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url || !tab.url.includes('youtube.com')) {
      return null;
    }
    
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  } catch (e) {
    return null;
  }
}

// Load state from storage and content script
async function loadState() {
  // First, try to get state from content script
  const contentState = await sendToContent({ type: 'GET_STATE' });
  
  if (contentState) {
    currentState.speed = contentState.currentSpeed;
    currentState.increment = contentState.increment;
    currentState.isOnYouTube = true;
    updateSpeedDisplay(currentState.speed);
    updateIncrementButtons(currentState.increment);
    updateStatus(true, contentState.isPlaying);
    return;
  }
  
  // Fall back to storage if not on YouTube
  chrome.storage.local.get(['currentSpeed', 'increment'], (result) => {
    currentState.speed = result.currentSpeed ?? DEFAULTS.currentSpeed;
    currentState.increment = result.increment ?? DEFAULTS.increment;
    updateSpeedDisplay(currentState.speed);
    updateIncrementButtons(currentState.increment);
    updateStatus(false, false);
  });
}

// Change speed
async function changeSpeed(delta) {
  const newSpeed = Math.max(
    DEFAULTS.minSpeed,
    Math.min(DEFAULTS.maxSpeed, currentState.speed + delta)
  );
  
  if (newSpeed === currentState.speed) return;
  
  currentState.speed = newSpeed;
  updateSpeedDisplay(newSpeed);
  
  // Update in storage
  chrome.storage.local.set({ currentSpeed: newSpeed });
  
  // Update content script if on YouTube
  await sendToContent({ type: 'SET_SPEED', speed: newSpeed });
}

// Set increment
async function setIncrement(value) {
  currentState.increment = value;
  updateIncrementButtons(value);
  
  // Update in storage
  chrome.storage.local.set({ increment: value });
  
  // Update content script
  await sendToContent({ type: 'SET_INCREMENT', increment: value });
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
  await sendToContent({ type: 'RESET' });
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
