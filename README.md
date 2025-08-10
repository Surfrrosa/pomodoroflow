# 🍅 PomodoroFlow

**The simplest set-and-forget Pomodoro timer**

Focus for 25 minutes, break for 5, and repeat—no settings, no distractions. One tap to start, clear countdown display, gentle chimes at each switch. Stay in your flow and let the timer handle the rest.

![PomodoroFlow Demo](/home/ubuntu/screenshots/file_home_ubuntu_152852.png)

## ✨ Features

- **🎯 Zero Configuration**: No settings, no distractions - just pure focus
- **⏱️ Standard Pomodoro Cycles**: 25min work → 5min break → repeat (15min long break every 4 cycles)
- **🎮 One-Tap Operation**: Single button to start/pause with spacebar shortcut
- **🔄 Auto-Progression**: Seamlessly transitions between sessions with 3-second delay
- **🔊 Gentle Audio Cues**: Soft chimes using Web Audio API for session transitions
- **📱 Responsive Design**: Works perfectly on desktop and mobile browsers
- **🎨 Visual Flow State**: Clean gradient UI that changes color between work (purple) and break (blue) modes
- **📋 Session Tracking**: Visual dots showing current session progress
- **🏷️ Dynamic Title**: Browser tab shows current countdown time

## 🚀 Quick Start

### Web App (Available Now)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Surfrrosa/pomodoroflow.git
   cd pomodoroflow
   ```

2. **Open in browser**:
   ```bash
   open index.html
   # or simply double-click index.html
   ```

3. **Start focusing**:
   - Click the **START** button or press **Spacebar**
   - Timer automatically cycles through work and break sessions
   - Gentle chimes notify you of session transitions

### Live Demo

🌐 **[Try PomodoroFlow Web App](https://surfrrosa.github.io/pomodoroflow)** *(Coming Soon)*

## 📱 Mobile App (In Development)

We're building a native mobile app using **Expo (React Native)** for the ultimate Pomodoro experience:

### Planned Features
- **📲 Native Mobile Experience**: True iOS and Android apps
- **🔔 Push Notifications**: Reliable alerts even when app is backgrounded
- **⚡ Background Timer**: Continues running when you switch apps
- **📳 Haptic Feedback**: Gentle vibrations for session transitions
- **🏪 App Store Distribution**: Available on iOS App Store and Google Play

### Development Roadmap

**Phase 1: MVP** *(In Progress)*
- Core 25/5 minute timer functionality
- Start/Pause/Stop controls
- Local notifications for session transitions
- Development testing via Expo Go

**Phase 2: Polish** *(Planned)*
- App icon and splash screen
- Settings for sound/vibration preferences
- Background color themes
- Multi-device testing

**Phase 3: Store Release** *(Future)*
- App Store and Google Play submission
- Marketing website
- Public release

## 🛠️ Technical Details

### Web App Stack
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Architecture**: Single-page application with class-based timer logic
- **Audio**: Web Audio API for cross-browser sound generation
- **Styling**: CSS gradients with responsive design
- **Dependencies**: Zero external dependencies

### Mobile App Stack *(Planned)*
- **Framework**: Expo (React Native)
- **Language**: JavaScript/TypeScript
- **Notifications**: Expo Notifications API
- **Audio**: Expo AV for native sound playback
- **Background Tasks**: Expo TaskManager
- **Testing**: Expo Go for rapid development

## 🎨 Design Philosophy

**Radical Simplicity**: PomodoroFlow embodies the principle of radical simplicity - no configuration screens, no complex settings, no feature bloat. Just the essential Pomodoro technique in its purest form.

- **One-Tap Operation**: Start your focus session with a single action
- **Automatic Flow**: Let the timer handle session transitions
- **Minimal Interface**: Clean design that fades into the background
- **Zero Distractions**: No unnecessary features or visual clutter

## 🔧 Development

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- For mobile development: Node.js 16+ and Expo CLI

### Local Development
```bash
# Web app - no build process needed
open index.html

# Mobile app (when available)
cd mobile-app
npm install
expo start
```

### Project Structure
```
pomodoroflow/
├── index.html          # Main web app page
├── styles.css          # UI styling and responsive design
├── script.js           # Core timer logic and Web Audio API
├── mobile-app/         # Mobile app (coming soon)
│   ├── App.js
│   ├── components/
│   └── services/
├── LICENSE             # MIT License
└── README.md           # This file
```

## 🤝 Contributing

We welcome contributions! Whether it's bug fixes, feature suggestions, or mobile app development help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Maintain the "radical simplicity" principle
- Test on multiple browsers/devices
- Follow existing code style and patterns
- Keep dependencies minimal

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the [Pomodoro Technique](https://francescocirillo.com/pages/pomodoro-technique) by Francesco Cirillo
- Built with love for focused productivity and flow states
- Special thanks to the open-source community

---

**Stay focused. Stay productive. Stay in your flow.** 🍅✨      
