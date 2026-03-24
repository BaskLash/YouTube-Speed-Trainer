# YouTube Speed Trainer

A Chrome extension that helps you gradually train yourself to watch YouTube videos at higher speeds.

## ✨ Features

- **Time-Based Progression**: Speed increases based on total watch time, not per video
- **Custom Increments**: Choose preset values (0.05, 0.10, 0.20) or enter any custom value
- **Visual Progress Bar**: See your progress toward the next speed level
- **Instant Speed Control**: Adjust speed anytime via the popup
- **Persistent Settings**: Your progress and settings sync across sessions

## 🚀 Installation

1. Download and unzip the extension
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** → select the extension folder
5. Start watching YouTube videos!

## 📖 How It Works

### Time-Based Progression

Instead of increasing speed per video (unfair for short clips), the extension tracks your **total watch time**:

| Watch Time | Effect |
|------------|--------|
| 5 minutes  | Progress bar fills |
| 10 minutes | **Level up!** Speed increases |
| 15 minutes | Another level up |
| etc.       | Continues until max speed |

**Why this is better:**
- Watching a 2-hour documentary = 12 level-ups (at 10min threshold)
- Watching twelve 10-second clips = still need real watch time
- Fairer, more consistent progression

### Custom Increments

Not everyone learns at the same pace:

| User Type | Recommended Increment |
|-----------|----------------------|
| Careful learner | 0.02 - 0.05 |
| Average user | 0.05 - 0.10 |
| Speed demon | 0.15 - 0.25 |

Enter any value from 0.01 to 1.00 in the custom input field.

## ⚙️ Settings

| Setting | Options | Default |
|---------|---------|---------|
| Step size | 0.01 - 1.00 | 0.05 |
| Level up every | 5m, 10m, 15m, 30m | 10 minutes |

## 🎯 Tips

1. **Start conservative**: Use small increments (0.03-0.05) if you're new
2. **Longer thresholds**: Choose 15-30 minute thresholds for podcasts/lectures
3. **Shorter thresholds**: Choose 5 minute thresholds for quick adaptation
4. **Manual adjustments**: Use +/- buttons for immediate changes

## 📁 Files

```
youtube-speed-trainer/
├── manifest.json    # Extension configuration
├── content.js       # Video control & time tracking
├── popup.html       # Extension popup UI
├── popup.js         # Popup logic
└── icon*.png        # Extension icons
```

## 🔧 Technical Details

- **Manifest V3**: Latest Chrome extension format
- **Time Tracking**: Accurate to 0.5 seconds, ignores background tabs
- **Storage**: chrome.storage.local for persistence
- **Speed Range**: 0.5× to 4.0×

## 🔒 Privacy

This extension:
- Does NOT collect any data
- Does NOT connect to external servers
- Only stores your settings locally in Chrome

## 📝 Changelog

### v1.2
- ✨ Time-based progression (replaces per-video)
- ✨ Custom increment input
- ✨ Visual progress bar
- 🐛 Fixed YouTube detection issues
- 🐛 Fixed real-time speed updates

### v1.1  
- Fixed popup not detecting YouTube pages
- Added real-time speed changes without reload

### v1.0
- Initial release

---

Made with ⚡ for faster learning
