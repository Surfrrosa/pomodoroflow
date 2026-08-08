# PomodoroFlow

A simple Pomodoro timer. 25 minutes on, 5 minutes off. One tap to start.

## Mobile App

Native iOS and Android app built with Expo. Notifications, haptics, background timer, tip jar.

```bash
cd mobile-app
npm install && npx expo start
```

Scan the QR code with Expo Go on your device.

### Tech Stack

- **Framework:** Expo 56 + React Native 0.85
- **Language:** JavaScript
- **Storage:** AsyncStorage
- **Notifications:** Expo Notifications (local scheduling)
- **Audio:** Expo AV
- **IAP:** expo-iap (cross-platform tip jar)
- **Error telemetry:** Sentry

## Landing Page

Static site deployed on Vercel: [pomodoroflow.app](https://pomodoroflow.app/)

```bash
open index.html
```

## Project Structure

```
pomodoroflow/
  mobile-app/
    App.js                  Main app component
    components/
      SplashScreen.tsx      Loading screen
      TipJarModal.tsx       Tip jar UI
    services/
      AnalyticsService.js   Analytics (stub)
      ReviewPromptService.js  App Store review prompts
      StreakService.js       Session streak tracking
      TipJarService.js       In-app tip jar logic
    config/                  App configuration
    __tests__/               Jest tests
  index.html                Landing page
  404.html                  Custom 404
  privacy.html              Privacy policy
  release-notes.html        Release notes
  docs/                     Architecture, runbook, a11y checklist
  press/                    Press kit images
```

## Commands

```bash
cd mobile-app
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm test           # Jest tests
npm run lint       # ESLint
```

## Documentation

- [Architecture](docs/architecture-one-pager.md)
- [Development Runbook](docs/runbook.md)
- [Accessibility Checklist](docs/a11y-checklist.md)
- [Lean Development](docs/LEAN_DEVELOPMENT.md)
- [Privacy Policy](docs/PRIVACY_POLICY.md)

## Privacy

Everything stays on your device. No accounts, no cloud sync. The landing page uses Google Analytics and Vercel Analytics for traffic. The mobile app does not collect or transmit any data.

## License

MIT License. See [LICENSE](LICENSE).
