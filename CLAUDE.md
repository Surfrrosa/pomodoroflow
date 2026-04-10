# PomodoroFlow

Simple Pomodoro timer. 25 minutes focus, 5 minutes break, one tap to start.

## Stack

- Expo 54 + React Native 0.81, JavaScript
- AsyncStorage for persistence
- Expo Notifications (local), Expo AV, Expo Haptics
- Expo In-App Purchases (tip jar, iOS only)
- Landing page: static HTML on Vercel

## Project layout

```
mobile-app/
  App.js                   Entire app: timer, UI, notifications, haptics
  components/
    SplashScreen.tsx        Animated loading screen
    TipJarModal.tsx         Donation UI ($1.99/$4.99/$9.99)
  services/
    AnalyticsService.js     Stub (Firebase removed in v1.0.3)
    ReviewPromptService.js  App Store review prompt timing
    StreakService.js         Daily streak + lifetime session count
    TipJarService.js        Tip jar trigger logic
  config/
    monetization.ts         All constants + storage keys
index.html                  Landing page
docs/                       Architecture, runbook, a11y, privacy
```

## Architecture

- All timer logic lives in App.js. Wall-clock based (phaseEndAt epoch timestamp), not interval counting. Reconciles elapsed time on app foreground.
- State machine: IDLE -> RUNNING -> PAUSED, auto-transitions between focus/break.
- Monetization: tip jar only, no subscriptions, no session limits. Completely free forever.
- Analytics: stub -- console.log in dev, no-op in prod. No Firebase.

## Commands

```bash
cd mobile-app
npm start              # Expo dev server
npm run ios            # iOS simulator
npm run android        # Android emulator
npm test               # Jest tests
npm run lint           # ESLint
npm run typecheck      # TypeScript checks
```

## EAS builds

```bash
cd mobile-app
eas build --platform ios --profile preview       # Internal testing
eas build --platform ios --profile production     # App Store
eas build --platform android --profile preview    # Internal testing
eas build --platform android --profile production # Play Store
eas submit --platform ios                         # Submit to App Store
eas submit --platform android                     # Submit to Play Store
```

Bundle ID: `com.surfrrosa.pomodoroflow`
App Store Connect ID: `6753604260`

## CI

GitHub Actions on push to main/develop and PRs to main: typecheck, lint, test with coverage, preview build on PRs, production build on main.

## Session logs

Session logs go in `docs/sessions/`. Name format: `YYYY-MM-DD.md`.
