# Changelog

All notable changes to PomodoroFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.3] - 2025-XX-XX (Current - In Development)

### Added
- **Tip Jar System**: Optional donation support ($1.99/$4.99/$9.99) with empathetic timing
  - Power User trigger (25 sessions): "You're crushing it! 🙏"
  - 30-Day Anniversary trigger (with 15+ sessions): "One month together! 🎉"
  - Maximum 3 modal prompts (lifetime) - never feels pushy
  - 7-day cooldown after review prompts (never stacks)
  - After 2 dismissals, never shows modal again
  - Always accessible via "💙 Support this app" link on main screen
- **Firebase Analytics**: Real Firebase Analytics implementation (replaced console.log stubs)
  - Full event tracking for conversions
  - Tip jar donation tracking (amount, trigger, value, currency)
  - Enhanced monetization analytics
- **TipJarModal Component**: Beautiful donation UI with 3 tiers
- **TipJarService**: Comprehensive timing and tracking logic

### Changed
- Updated version to 1.0.3 in app.json
- Enhanced AnalyticsService with real Firebase Analytics SDK
- Added Firebase plugin to app configuration
- Improved documentation accuracy (README, CHANGELOG)

### Fixed
- **Critical**: Missing VERSION_PROMPTED storage key (would crash ReviewPromptService)
- **Critical**: Typo in TipJarService (getShownCount had space in method name)

### Removed
- **28 unused dependencies** (~20MB bundle size reduction):
  - canvas, react-dom, react-native-web
  - Various duplicate/unused packages
- **Dead code files**:
  - components/PremiumApp.js (unused wrapper)
  - types/timer.ts (unused TypeScript definitions)

### Technical Details
- **New Dependencies**:
  - `expo-in-app-purchases` - Tip jar donations
  - `@react-native-firebase/app@21.8.1` - Firebase core
  - `@react-native-firebase/analytics@21.8.1` - Real analytics
- **New Services**: TipJarService.js
- **New Components**: TipJarModal.tsx
- **Configuration**: Added tip jar product IDs to monetization.ts

---

## [1.0.2] - 2025-XX-XX (Production Ready)

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

## [1.0.1] - 2025-XX-XX

### Fixed
- Minor bug fixes
- Performance improvements
- Notification reliability enhancements

---

## [1.0.0] - 2025-XX-XX (Initial Release)

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

## Release Notes Template (For App Store Submissions)

### v1.0.2 Release Notes

**New in This Version:**

We've added a premium upgrade option to support continued development while keeping the core app experience free.

**What's New:**
- 7-day free trial for new users (unlimited sessions)
- Free tier: 8 Pomodoro sessions per day
- Premium: Unlimited sessions ($4.99 one-time purchase)
- Existing users: You're grandfathered - unlimited sessions forever!
- App review prompts: Help us grow by rating the app

**Still Free & Simple:**
- Beautiful 25/5 Pomodoro timer
- Background timer support
- Sound and haptic feedback
- No subscriptions, no recurring fees

**Thank You:**
To all our existing users - thank you for your support. This update doesn't change anything for you. You'll continue to have unlimited access, always.

---

## Versioning Strategy

**Major version (X.0.0)**: Breaking changes, major features
**Minor version (1.X.0)**: New features, backwards compatible
**Patch version (1.0.X)**: Bug fixes, minor improvements

---

## Upgrade Notes

### Migrating from v1.0.1 to v1.0.2

**For Developers:**
- Install new dependencies: `npm install`
- Review `config/monetization.ts` for settings
- Configure RevenueCat account and API keys
- Set up IAP products in App Store Connect / Google Play Console
- Test purchase flow in sandbox environment

**For Users:**
- Existing users: No changes, unlimited sessions forever
- New users: 7-day grace period, then 8 sessions/day limit
- Premium option available via in-app purchase

---

## Known Issues

### v1.0.2
- None currently known

### Previous Versions
- v1.0.0: Notification scheduling could duplicate on rapid pause/resume (fixed in v1.0.1)

---

## Future Roadmap

### v1.0.4 (Planned - Quality Improvements)
- Migrate App.js to TypeScript
- Add comprehensive unit tests
- Add error telemetry (Sentry)
- Performance monitoring
- A/B testing infrastructure

### v1.1.0 (Planned - Feature Expansion)
- Custom timer durations (user-configurable 25/5)
- Session history and statistics
- Long break support (every 4 Pomodoros)
- Premium themes and sounds
- Focus goals and streaks

### v1.2.0 (Planned - Advanced Features)
- Session analytics dashboard
- Productivity insights
- Export session data
- Multiple timer profiles
- Widget support (iOS 14+)

---

## Credits

**Developer:** Shaina Pauley
**Design:** Minimalist design philosophy
**Inspiration:** The Pomodoro Technique by Francesco Cirillo

---

## Links

- **App Store:** [Add link]
- **Play Store:** [Add link]
- **Privacy Policy:** [Add link]
- **Terms of Use:** [Add link]
- **Support:** [Add email]

---

**Last Updated:** v1.0.2 Release
