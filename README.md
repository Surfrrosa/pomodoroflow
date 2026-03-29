# 🍅 PomodoroFlow

> **A radically simple Pomodoro timer for focus**

[![Expo](https://img.shields.io/badge/Expo-53.0-blue.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-blue.svg)](https://reactnative.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub Actions](https://img.shields.io/badge/CI-GitHub%20Actions-orange.svg)](../../actions)

Focus for 25 minutes, break for 5, repeat. No settings, no distractions. One tap to start, gentle chimes to guide you. Stay in your flow and let the timer handle the rest.

##  Quick Start

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

### Landing Page

 **[Visit the landing page](https://pomodoroflow-brown.vercel.app/)**

##  Mobile App (Production Ready)

Native iOS and Android app with premium monetization, notifications, and background timer support.

### Quick Start

```bash
# Clone and run
git clone https://github.com/Surfrrosa/pomodoroflow.git
cd pomodoroflow/mobile-app
npm install && npx expo start
```

Scan QR code with Expo Go app on your device.

##  Core Features

- ** Zero Configuration** - No settings, just pure focus
- ** Standard Pomodoro** - 25min work → 5min break cycles
- ** Native Mobile** - iOS & Android with background notifications
- ** Gentle Audio Cues** - Soft chimes for session transitions
- ** Session Tracking** - Visual progress indicators
- ** Premium Monetization** - Freemium model with $4.99 upgrade
- **♿ Accessibility Ready** - VoiceOver/TalkBack support

##  Platform Support

| Platform | Status | Features |
|----------|--------|----------|
| **iOS** | Production | Notifications, haptics, background timer |
| **Android** | Production | Notifications, haptics, background timer |
| **Web** | Demo | Basic timer functionality |

##  Tech Stack

**Mobile App (Primary)**
- **Framework**: Expo 53 + React Native 0.79
- **Language**: JavaScript (TypeScript migration in progress)
- **Navigation**: Stack-based navigation
- **Storage**: AsyncStorage for persistence
- **Notifications**: Expo Notifications with local scheduling
- **Audio**: Expo AV for native sound playbook
- **Testing**: Jest + React Native Testing Library

**Web App (Demo)**
- **Frontend**: Pure HTML5, CSS3, JavaScript ES6+
- **Audio**: Web Audio API
- **Architecture**: Single-page application

## Project Structure

```
pomodoroflow/
├── mobile-app/              # React Native Expo app
│   ├── App.js              # Main app component
│   ├── components/         # UI components
│   │   ├── Timer.js       # Timer display
│   │   ├── Controls.js    # Start/pause/reset buttons
│   │   └── SessionIndicator.js # Progress dots
│   ├── services/          # Business logic
│   │   └── TimerService.js # Core timer logic
│   └── __tests__/         # Test files
├── docs/                  # Documentation
├── index.html            # Web demo
├── script.js             # Web app logic
└── styles.css            # Web app styling
```

## Development

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Commands
```bash
# Development
npm run start      # Start Expo dev server
npm run ios        # Open iOS simulator
npm run android    # Open Android emulator
npm run test       # Run tests

# Production
npm run build:ios     # Build for iOS App Store
npm run build:android # Build for Google Play
```

### Testing
```bash
cd mobile-app
npm test           # Unit tests
npm run test:e2e   # End-to-end tests (coming soon)
```

## Codebase Stats

- **Total Lines**: ~980 (staying lean!)
- **Core Logic**: ~650 lines
- **Test Coverage**: 65%+ target
- **Dependencies**: 13 essential packages

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/focus-enhancement`)
3. Follow the [lean development principles](docs/LEAN_DEVELOPMENT.md)
4. Ensure tests pass (`npm test`)
5. Submit pull request

### Development Guidelines
- Maintain "radical simplicity" principle
- Keep total codebase under 2,000 lines
- Test on real devices for notifications
- Follow accessibility best practices

## Documentation

- **[Architecture Overview](docs/architecture-one-pager.md)** - System design and patterns
- **[Development Runbook](docs/runbook.md)** - EAS builds, deployment, debugging
- **[Accessibility Checklist](docs/a11y-checklist.md)** - VoiceOver, TalkBack compliance
- **[Lean Development](docs/LEAN_DEVELOPMENT.md)** - Code philosophy and guidelines

## Privacy & Security

PomodoroFlow is privacy-first:
- **No data collection** - Everything stays on your device
- **No analytics** - No tracking or telemetry
- **Local storage only** - AsyncStorage for session history
- **No network requests** - Fully offline capable

See [Security Policy](SECURITY.md) for details.

## App Store Status

**Current Status**: Development
**Target**: TestFlight/Play Store Beta Q1 2024

- [x] Core timer functionality
- [x] Mobile notifications
- [x] Basic accessibility
- [ ] TypeScript migration
- [ ] Comprehensive testing
- [ ] App Store assets

## Acknowledgments

Inspired by the [Pomodoro Technique](https://francescocirillo.com/pages/pomodoro-technique) by Francesco Cirillo.

Built with ❤️ for focused productivity and flow states.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Stay focused. Stay productive. Stay in your flow.** 
