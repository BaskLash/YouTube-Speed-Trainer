# YouTube Speed Trainer

A Chrome extension that helps you gradually train yourself to watch YouTube videos at higher speeds.

## ✨ Features

- **Automatic Speed Progression**: Each completed video automatically increases your playback speed
- **Smart Completion Detection**: Speed only increases after watching 80%+ of a video
- **Manual Controls**: Adjust speed anytime via the popup
- **Persistent Settings**: Your speed carries over between videos and sessions
- **Clean UI**: Minimal, intuitive interface

## 🚀 Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `youtube-speed-trainer` folder
5. The extension icon will appear in your toolbar

## 📖 How It Works

1. **Start watching**: The extension applies your current speed to any YouTube video
2. **Complete videos**: Watch at least 80% of a video to trigger a speed increase
3. **Gradual progression**: Each completion bumps your speed by the configured increment
4. **Train your brain**: Over time, you'll comfortably watch videos at 1.5×, 2×, or even higher!

## ⚙️ Settings

Click the extension icon to open the popup:

- **Speed Display**: Shows your current playback speed
- **+/- Buttons**: Manually adjust speed instantly
- **Increment**: Choose how much speed increases after each video (0.05× to 0.25×)
- **Reset**: Return to 1.0× starting speed

## 🎯 Tips

- Start with a small increment (0.05×) for gradual adaptation
- Use larger increments (0.15×-0.25×) if you want faster progression
- Manual adjustments update your baseline for future videos
- The extension works on all YouTube videos, including embedded ones

## 📁 Files

```
youtube-speed-trainer/
├── manifest.json    # Extension configuration
├── content.js       # Video speed control logic
├── popup.html       # Extension popup UI
├── popup.js         # Popup interaction logic
├── icon16.png       # Small icon
├── icon48.png       # Medium icon
└── icon128.png      # Large icon
```

## 🔧 Technical Details

- **Manifest V3**: Uses the latest Chrome extension format
- **Chrome Storage**: Syncs settings across devices
- **MutationObserver**: Detects YouTube's dynamic video loading
- **Event-based**: Efficient completion detection without polling

## 📝 License

MIT License - Feel free to modify and share!
