# PomodoroFlow

Simple Pomodoro timer. 25 minutes focus, 5 minutes break, one tap to start.

## Stack

- Expo 56 + React Native 0.85, JavaScript
- AsyncStorage for persistence
- Expo Notifications (local), Expo AV, Expo Haptics
- expo-iap (tip jar, iOS + Android)
- Sentry (error telemetry, versioned via `release: pomodoroflow@<version>`)
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

## Before writing new code

This is a small, deliberately-consolidated project. Grep before you add.

- **Constants + storage keys** — `mobile-app/config/monetization.ts` holds
  every product ID, price, storage key, and feature flag. Don't hardcode
  a `$1.99` or an `@pomodoroflow:...` string in a component; add to this
  file and import.
- **Side concerns (streak, analytics, review prompts, tip jar, error
  reporting)** — extend an existing service in `mobile-app/services/`
  before adding a new one. Services are leaf-pure: they import only
  `config/monetization.ts`, expo modules, and `services/ErrorReporter`.
  Don't cross-import between services.
- **Timer logic** — lives entirely in `mobile-app/App.js` by design.
  Do not extract a `TimerService` — the single-file structure is
  documented in `docs/architecture-one-pager.md` under "Why single-file"
  and matches the app's philosophy ("Radical simplicity — 25/5 on loop").
- **Error handling** — swallowed exceptions are invisible in prod. Any
  `try/catch` that hides a failure should call
  `ErrorReporter.captureException(err, { where: '...' })` so it lands in
  Sentry with context.
- **IAP flow** — `expo-iap` is event-driven, not promise-driven. The
  Promise wrapper in `TipJarModal.handleTip` is the reference pattern:
  set up both `purchaseUpdatedListener` and `purchaseErrorListener`
  before calling `requestPurchase`, and `cleanup()` both on either
  outcome. Consumables must call `finishTransaction({ isConsumable: true })`
  after success or Android won't allow re-purchase.

Don't add a new file for a one-off variant of an existing pattern. If
you're about to copy-paste a file and tweak two values, extract a helper
in the existing service or the config instead.
