# Changelog

All notable changes to PomodoroFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.7] - 2026-03-29 (Current)

### Changed
- Expo updated to 54.0.30 for build compatibility
- Removed metro.config.js (was causing build issues)
- Gutted dead files, stripped stray emojis, rewrote README
- SEO audit fixes: meta tags, 404 page, WebP images, favicons, manifest
- Added Vercel Analytics to website pages
- Release notes page added

---

## [1.0.6] - 2026-01

### Added
- **Streak tracking**: Daily streak counter and lifetime session count
- **Gamification storage keys**: streak count, last session date, lifetime sessions

---

## [1.0.5] - 2026-01

### Changed
- Custom deep matte red heart icon for Support button
- Support button hidden on Android (tip jar is iOS-only)

---

## [1.0.4] - 2025-12

### Changed
- **Overcast Model**: Removed all premium/paywall features. App is completely free forever, tip jar only.
- Removed RevenueCat, FreemiumService, SessionTrackingService, UpgradePrompt
- Removed session limits and grace period
- Fixed review prompt trigger bugs (3 critical)
- Enabled iOS tip jar AND Android builds (no more trade-offs)

---

## [1.0.3] - 2025-12-15

### Added
- **Tip Jar System**: Optional donation support ($1.99/$4.99/$9.99) with empathetic timing
  - Power User trigger (25 sessions)
  - 30-Day Anniversary trigger (with 15+ sessions)
  - Maximum 3 modal prompts (lifetime), 7-day cooldown after review prompts
  - After 2 dismissals, never shows modal again
  - Always accessible via "Support this app" link on main screen
- **TipJarModal Component**: Donation UI with 3 tiers
- **TipJarService**: Timing and tracking logic

### Changed
- Firebase removed (deferred indefinitely). AnalyticsService is a console.log stub.

### Fixed
- Missing VERSION_PROMPTED storage key (would crash ReviewPromptService)
- Typo in TipJarService (getShownCount had space in method name)

### Removed
- 28 unused dependencies (~20MB bundle size reduction)
- Dead code: PremiumApp.js, timer.ts
- Firebase dependencies

---

## [1.0.2] - 2025-09-27 (Production Ready)

### Added
- **Freemium Model**: New users get 7-day grace period, then 8 sessions/day limit
- **Premium Upgrade**: One-time $4.99 purchase for unlimited sessions
- **Native Review Prompts**: Automatic app review requests at key milestones
- **Session Tracking**: Background tracking of daily and total sessions
- **Legacy User Protection**: Existing users automatically grandfathered (unlimited forever)
- **Upgrade Modal**: Beautiful native-styled upgrade prompt when limit reached
- **Session Counter**: Shows "X/8 sessions today" for free users after grace period
- **Analytics Events**: Comprehensive tracking for monetization and engagement

### Changed
- **Architecture**: Refactored to single source of truth pattern (PremiumProvider)
- **Configuration**: Centralized all constants in `config/monetization.ts`
- **Storage Keys**: Consolidated from 3 definitions to 1 central source
- **Feature List**: Upgrade modal now shows only implemented features (App Store compliant)

### Removed
- **Dead Code**: Removed 700+ lines of unused files (timer.ts, TimerService.js, etc.)
- **Broken Tests**: Removed test files for unused components
- **TypeScript Errors**: Fixed all compilation errors (now compiles cleanly)

### Developer Experience
- Created comprehensive documentation suite
- Added development helpers for testing different user types
- Improved code quality and maintainability
- Zero technical debt from implementation

### Technical Details
- **Dependencies**: Added `expo-store-review@9.0.8`, `react-native-purchases@9.6.0`
- **Services**: New FreemiumService, SessionTrackingService, ReviewPromptService
- **Components**: PremiumProvider (React Context), UpgradePrompt (modal)
- **Configuration**: Single config file for all monetization settings

---

## [1.0.1] - 2025-08-11

### Fixed
- Minor bug fixes
- Performance improvements
- Notification reliability enhancements

---

## [1.0.0] - 2025-08-10 (Initial Release)

### Added
- **Core Pomodoro Timer**: 25-minute focus / 5-minute break intervals
- **Background Support**: Timer continues when app backgrounded
- **Local Notifications**: Alerts when phase completes
- **Sound & Haptics**: Chime sound and haptic feedback on completion
- **State Persistence**: Timer state saved across app restarts
- **Dev Fast Mode**: 10-second timer for rapid testing (dev mode only)
- **Splash Screen**: Beautiful animated app launch
- **Analytics**: Firebase Analytics integration
- **Platform Support**: iOS and Android via React Native

### Technical
- Built with Expo SDK 54
- React Native 0.81.4
- TypeScript support
- Firebase Analytics
- AsyncStorage for persistence
- Expo Notifications for background alerts

---

**Last Updated:** v1.0.7
