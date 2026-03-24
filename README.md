# YouTube Speed Trainer

A Chrome extension that gradually increases YouTube video playback speed to help you train your brain to process faster content.

## Features

- **Automatic Speed Progression**: Each completed video increases speed for the next one
- **Learning-Based**: Only increases speed after watching 80% of a video (minimum 1 minute)
- **Manual Control**: Adjust speed anytime via the popup
- **Configurable Step Size**: Choose between +0.05, +0.10, or +0.20 increments
- **Persistent Settings**: Your speed carries over between sessions
- **On-Screen Notifications**: See when you've unlocked the next speed level

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select this folder (`youtube-speed-trainer`)
5. The extension icon will appear in your toolbar

## Usage

### Automatic Training
1. Just watch YouTube videos normally
2. When you watch 80% of a video (longer than 1 minute), the next video will play slightly faster
3. Over time, you'll naturally adapt to higher speeds

### Manual Control
- Click the extension icon to open the popup
- Use **−** and **+** buttons to adjust speed immediately
- Choose your preferred step size (0.05, 0.10, or 0.20)
- Click "Reset" to go back to 1.0×

### Speed Limits
- Minimum: 0.5×
- Maximum: 4.0×

## How It Works

The extension tracks your viewing progress. When you watch at least 80% of a video that's longer than 1 minute, it considers the video "completed" and increments your speed for the next video.

This gradual approach helps your brain adapt without the jarring experience of jumping directly to 2× or higher speeds.

## Files

```
youtube-speed-trainer/
├── manifest.json    # Extension configuration
├── content.js       # YouTube page integration
├── popup.html       # Control panel UI
├── popup.js         # Control panel logic
├── icon.png         # Extension icon
└── README.md        # This file
```

## Tips

- Start with the 0.05 increment for a gentle progression
- Use 0.10 or 0.20 if you want to train faster
- Don't hesitate to manually decrease speed if it gets uncomfortable
- The goal is gradual adaptation, not instant speed

## Privacy

This extension:
- Does NOT collect any data
- Does NOT connect to external servers
- Only stores your speed settings locally in Chrome

---

Made with ⚡ for faster learning
