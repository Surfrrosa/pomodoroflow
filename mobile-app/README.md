# PomodoroFlow Mobile App

**Version:** 1.0.2 (Production Ready)
**Platform:** iOS & Android (React Native with Expo)
**License:** Proprietary
**Developer:** Shaina Pauley

---

## Overview

PomodoroFlow is a beautifully simple Pomodoro timer app that helps users focus with the proven 25/5 technique. Built with radical simplicity in mind - just tap Start and flow.

**Tagline:** *Radical simplicity - 25/5 on loop.*

### Features

**Core Timer (v1.0.0+)**
- 25-minute focus sessions
- 5-minute break intervals
- Background timer continuation
- Local notifications
- Sound and haptic feedback
- State persistence across app restarts
- Beautiful splash screen

**Monetization & Review System (v1.0.2+)**
- Freemium model with 7-day grace period
- 8 sessions/day for free users (after grace)
- Premium upgrade: $4.99 one-time purchase (unlimited sessions)
- Optional tip jar: $1.99 / $4.99 / $9.99 (support developer)
- Native app review prompts (iOS & Android)
- Empathetic timing: never stacks review + tip jar prompts
- Legacy user protection (existing users grandfathered)
- Firebase Analytics for conversion tracking

---

## Project Structure

```
mobile-app/
├── App.js                          # Main application component
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
│
├── components/                     # React components
│   ├── SplashScreen.tsx           # App splash screen
│   ├── PremiumProvider.tsx        # Premium state context
│   ├── UpgradePrompt.tsx          # Premium upgrade modal
│   └── TipJarModal.tsx            # Donation/tip jar modal
│
├── services/                       # Business logic services
│   ├── AnalyticsService.js        # Firebase Analytics integration
│   ├── FreemiumService.js         # Session limit logic
│   ├── ReviewPromptService.js     # App review prompts
│   ├── SessionTrackingService.js  # Session counting
│   └── TipJarService.js           # Tip jar timing & tracking
│
├── lib/                            # Core libraries
│   └── purchases.ts               # RevenueCat IAP wrapper
│
├── config/                         # Configuration
│   └── monetization.ts            # All monetization constants
│
├── assets/                         # Static files
│   └── chime.mp3                  # Session completion sound
│
└── docs/                           # Documentation
    ├── IMPLEMENTATION_SUMMARY.md  # Implementation details
    ├── QUALITY_REVIEW.md          # Production readiness review
    ├── TESTING_GUIDE.md           # Testing scenarios
    ├── MONETIZATION_STRATEGY.md   # Strategy document
    └── generate-assets.md         # Asset generation guide
```

---

## Technology Stack

**Framework & Platform:**
- React Native 0.81.4
- Expo SDK 54
- TypeScript & JavaScript
- React 19.1.0

**Key Dependencies:**
- `expo-notifications` - Local notifications
- `expo-av` - Audio playback (chime sound)
- `expo-haptics` - Haptic feedback
- `expo-store-review` - Native review prompts
- `expo-in-app-purchases` - Tip jar donations
- `react-native-purchases` - RevenueCat IAP (premium upgrade)
- `@react-native-firebase/app` - Firebase core
- `@react-native-firebase/analytics` - Firebase Analytics tracking
- `@react-native-async-storage/async-storage` - Local storage

---

## Getting Started

### Prerequisites

```bash
node >= 18
npm >= 9
expo-cli (optional, can use npx)
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Development Mode

**Fast Mode Toggle:**
In `__DEV__` mode, a dev toggle appears that changes timer to 10-second focus / 5-second break for rapid testing.

**Hot Reloading:**
Changes to code automatically refresh the app (Expo Fast Refresh).

---

## Configuration

### Monetization Settings

All monetization constants are centralized in `config/monetization.ts`:

```typescript
export const MONETIZATION_CONFIG = {
  FREE_TIER_DAILY_LIMIT: 8,              // Sessions per day for free users
  GRACE_PERIOD_DAYS: 7,                  // Days of unlimited access for new users
  PREMIUM_PRICE_USD: 4.99,               // One-time purchase price
  PREMIUM_PRICE_DISPLAY: '$4.99',        // Display string

  // RevenueCat API Keys
  REVENUECAT_IOS_KEY: 'appl_...',
  REVENUECAT_ANDROID_KEY: 'goog_...',
  REVENUECAT_ENTITLEMENT_ID: 'pro',

  // Review Prompts
  REVIEW_PROMPT_SESSIONS_MILESTONE: 10,
  REVIEW_PROMPT_ANNIVERSARY_DAYS: 7,
  REVIEW_PROMPT_PRODUCTIVE_DAY_SESSIONS: 8,
  REVIEW_PROMPT_COOLDOWN_DAYS: 90,
};
```

To change limits, pricing, or review triggers, edit this single file.

### Firebase Configuration

**iOS:** `google-services.json`
**Android:** `GoogleService-Info.plist`

These files are configured per environment and include Firebase project credentials.

---

## User Flow

### New User Experience

**Days 1-7 (Grace Period):**
- Unlimited sessions
- No upgrade prompts
- Session counter: Not shown
- Status: "Trial: X days remaining"

**Day 8+ (Free Tier):**
- 8 sessions per day limit
- Counter shown: "3/8 sessions today"
- Upgrade modal appears when limit reached
- Daily reset at midnight (local time)

### Legacy User Experience

**Existing users from v1.0.0/v1.0.1:**
- Automatically detected on first v1.0.2 launch
- Unlimited sessions forever (grandfathered)
- No counters or upgrade prompts
- Status: "Legacy User - Unlimited"

### Premium User Experience

**After $4.99 purchase:**
- Unlimited sessions
- No counters or prompts
- Status: "Premium - Unlimited"
- One-time payment, lifetime access

---

## Session Tracking

### Storage Keys

All AsyncStorage keys use the `@pomodoroflow:` prefix:

```javascript
// Timer State
'pomodoroflow_state' → { phase, phaseStartAt, phaseEndAt }

// Session Tracking
'@pomodoroflow:daily_sessions' → Number (current day count)
'@pomodoroflow:last_session_date' → String (date for reset logic)
'@pomodoroflow:install_date' → Timestamp (for grace period)
'@pomodoroflow:legacy_user' → 'true' | 'false'

// Premium Status
'@pomodoroflow:is_premium' → 'true' | 'false'
'@pomodoroflow:user_id' → String (RevenueCat user ID)

// Review Prompts
'@pomodoroflow:review_total_sessions' → Number
'@pomodoroflow:review_prompt_count' → Number (0-3)
'@pomodoroflow:review_last_prompt_date' → Timestamp
```

### Daily Reset Logic

Session counters reset at midnight local time. The app checks `LAST_SESSION_DATE` against `new Date().toDateString()` to detect day changes.

---

## Review Prompt System

### Triggers

1. **10 Sessions Milestone**: After completing 10 total focus sessions
2. **7-Day Anniversary**: On the 7th day since install (if 5+ sessions completed)
3. **Productive Day**: After completing 8 sessions in one day

### Platform Limits

- iOS: Maximum 3 prompts per 365 days (Apple-enforced)
- Android: Similar limit enforced by Google Play
- Cooldown: 90 days between prompts (app-enforced)

### Implementation

Uses native `expo-store-review` API:
- `StoreReview.isAvailableAsync()` - Check if available
- `StoreReview.requestReview()` - Show native prompt

Platform decides whether to actually show the prompt based on internal criteria.

---

## Tip Jar System

### Overview

Optional donation system that respects user attention and never feels pushy.

**Design Principles:**
- 100% optional - app is always free
- Never stacks with review prompts (7-day cooldown)
- Maximum 3 prompts total (lifetime)
- After 2 dismissals, never shows again
- Won't show if user already donated

### Triggers

1. **Power User** (25 completed sessions)
   - "You're crushing it! 🙏"
   - Recognizes heavy users who get value

2. **30-Day Anniversary** (with 15+ sessions)
   - "One month together! 🎉"
   - Celebrates sustained usage

### Donation Tiers

- **Coffee** ☕ - $1.99 (Small thanks)
- **Lunch** 🍜 - $4.99 (Big thanks)
- **Supporter** 🎉 - $9.99 (Huge thanks)

### Always-Available Access

Users can always access the tip jar via:
- "💙 Support this app" link at bottom of main screen
- Settings screen (if added in future)

### Product IDs

**iOS:**
- `com.surfrrosa.pomodoroflow.tip_coffee`
- `com.surfrrosa.pomodoroflow.tip_lunch`
- `com.surfrrosa.pomodoroflow.tip_supporter`

**Android:**
- `tip_coffee`
- `tip_lunch`
- `tip_supporter`

All configured in `config/monetization.ts`.

---

## In-App Purchase Integration

### RevenueCat Setup

**Products:**
- iOS: `com.surfrrosa.pomodoroflow.premium`
- Android: `premium_unlock`
- Type: Non-consumable (one-time purchase)
- Price: $4.99 USD

**Entitlement:** `pro`

### Purchase Flow

1. User hits 8-session daily limit
2. Upgrade modal appears
3. User taps "Upgrade to Premium"
4. RevenueCat handles platform-specific purchase
5. Premium status saved locally
6. Counter disappears, unlimited access granted

### Restore Purchases

Users can restore previous purchases after:
- Reinstalling the app
- Switching devices
- Losing premium status

Accessed via "Restore Purchases" button in upgrade modal.

---

## Analytics Events

### Session Events
- `sessionStart` - When Start pressed
- `sessionComplete` - When phase completes
- `sessionPause` - When Pause pressed
- `sessionStop` - When Stop pressed
- `sessionResume` - When Resume pressed

### Monetization Events
- `upgradeModalShown` - Upgrade modal displayed
- `upgradeModalDismissed` - User closed modal
- `purchaseAttempt` - User tapped purchase button
- `purchaseSuccess` - Purchase completed
- `purchaseFailed` - Purchase failed
- `sessionLimitWarning` - User approaching limit (6/8 sessions)
- `sessionLimitReached` - User hit limit (8/8 sessions)

### Review Events
- `review_prompt_attempted` - App requested review
- `review_prompt_shown` - Platform showed prompt

### Tip Jar Events
- `tip_jar_shown` - Tip jar modal displayed (with trigger)
- `tip_jar_dismissed` - User dismissed tip jar
- `tip_jar_donation` - User completed donation (with amount, trigger, value, currency)

All events tracked via Firebase Analytics.

---

## Testing

### Manual Testing Scenarios

See `docs/TESTING_GUIDE.md` for comprehensive testing instructions.

**Quick Tests:**
1. Fresh install → Grace period active
2. Simulate 10 days later → Session limits enforce
3. Complete 8 sessions → Upgrade modal appears
4. Purchase premium → Unlimited access granted
5. Restore purchases → Premium status restored

### Development Helpers

```javascript
// Simulate different user types
const FreemiumService = require('./services/FreemiumService').default;

// Test grace period user
await FreemiumService.simulateUserType('new_grace');

// Test user after grace
await FreemiumService.simulateUserType('new_after_grace');

// Test user at limit
await FreemiumService.simulateUserType('at_limit');

// Test legacy user
await FreemiumService.simulateUserType('legacy');

// Check current status
const status = await FreemiumService.getStatus();
console.table(status);
```

---

## Building for Production

### Type Check

```bash
npm run typecheck  # Should show: No TypeScript errors
```

### Build with EAS

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### Submit to Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

---

## Troubleshooting

### "No products available"

**Cause:** RevenueCat products not configured
**Fix:** See `docs/IMPLEMENTATION_SUMMARY.md` Phase 1-3

### "Purchases not initialized"

**Cause:** RevenueCat API keys missing
**Fix:** Check `config/monetization.ts` has correct keys

### Sessions not counting

**Cause:** SessionTrackingService not incrementing
**Fix:** Check console for `[SessionTracking]` logs

### Timer doesn't work

**Cause:** Rare - core timer logic is stable
**Fix:** Check console for errors, verify AsyncStorage permissions

---

## App Store Submission

### iOS App Store Connect

1. Configure in-app purchase product:
   - Type: Non-Consumable
   - Product ID: `com.surfrrosa.pomodoroflow.premium`
   - Price: $4.99 (Tier 5)

2. Add screenshots (required: 6.5" iPhone, 12.9" iPad)

3. Update "What's New" with v1.0.2 changes

4. Submit for review

### Google Play Console

1. Create managed product:
   - Product ID: `premium_unlock`
   - Price: $4.99

2. Update release notes

3. Submit to production track

### Review Timeline

- iOS: Typically 24-48 hours
- Android: Typically 1-3 days

---

## Version History

### v1.0.3 (Current - In Development)
- Optional tip jar donation system ($1.99/$4.99/$9.99)
- Firebase Analytics fully implemented (not stubs)
- Empathetic prompt timing (never stacks review + tip jar)
- "Support this app" link on main screen
- Fixed critical bugs from code audit
- Removed 28 unused dependencies (~20MB savings)
- Cleaned up dead code files

### v1.0.2
- Freemium model with grace period
- Premium upgrade ($4.99)
- Native review prompts
- Session tracking
- Legacy user protection
- Code quality refactoring

### v1.0.1
- Bug fixes
- Performance improvements

### v1.0.0 (Initial Release)
- Core Pomodoro timer (25/5)
- Background notifications
- State persistence
- Analytics tracking
- Splash screen

---

## Contributing

This is a proprietary project. For bug reports or feature requests, contact the developer.

---

## Support

**Developer:** Shaina Pauley
**Email:** [Add support email]
**Website:** [Add website URL]

---

## License

Copyright © 2025 Shaina Pauley. All rights reserved.

This is proprietary software. Unauthorized copying, distribution, or modification is prohibited.

---

## Documentation

For detailed information, see:
- `docs/IMPLEMENTATION_SUMMARY.md` - Complete implementation guide
- `docs/QUALITY_REVIEW.md` - Production readiness assessment
- `docs/TESTING_GUIDE.md` - Testing scenarios and commands
- `docs/MONETIZATION_STRATEGY.md` - Strategy and pricing research

---

**Last Updated:** v1.0.2 Release
