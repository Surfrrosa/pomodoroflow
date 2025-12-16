# Testing Guide - v1.0.2 Monetization Features

## 🚀 Quick Start Testing

### 1. Start the development server
```bash
npm start
# or
npx expo start --lan
```

### 2. Run on device/simulator
```bash
# iOS
npm run ios

# Android
npm run android
```

## 🧪 Testing Scenarios

### Scenario 1: New User (Grace Period)
**Expected**: Unlimited sessions for 7 days

```javascript
// Open React Native debugger console and run:
import FreemiumService from './services/FreemiumService';
import SessionTrackingService from './services/SessionTrackingService';

// Reset to fresh install
await SessionTrackingService.resetForTesting();

// Check status
const status = await FreemiumService.getStatus();
console.log(status);
// Should show: inGracePeriod: true, canStart: true
```

**Test**:
1. Start multiple sessions (> 8)
2. All should work without upgrade prompt
3. Counter should NOT show (unlimited in grace)

---

### Scenario 2: New User After Grace Period
**Expected**: 8 sessions/day limit

```javascript
// Simulate user who installed 10 days ago
await FreemiumService.simulateUserType('new_after_grace');

// Check status
const status = await FreemiumService.getStatus();
console.log(status);
// Should show: inGracePeriod: false, canStart: true, dailySessions: 0
```

**Test**:
1. Start session #1-7 → should work
2. Session counter shows "7/8 sessions today"
3. Start session #8 → should work
4. Counter shows "8/8 sessions today"
5. Try session #9 → **Upgrade modal appears**
6. Close modal → stays on home screen
7. Tap "Start" again → modal appears again

---

### Scenario 3: User Near Limit (Warning)
**Expected**: Shows warning analytics event

```javascript
// Simulate user with 6 sessions today
await FreemiumService.simulateUserType('near_limit');

const status = await FreemiumService.getStatus();
console.log(status);
// Should show: dailySessions: 6, sessionsRemaining: 2
```

**Test**:
1. Counter shows "6/8 sessions today"
2. Start a session → should work
3. Check console for: `[ANALYTICS] session_limit_warning`
4. Complete session → counter shows "7/8"

---

### Scenario 4: User At Limit
**Expected**: Upgrade modal on start attempt

```javascript
// Simulate user who hit limit
await FreemiumService.simulateUserType('at_limit');

const status = await FreemiumService.getStatus();
console.log(status);
// Should show: dailySessions: 8, sessionsRemaining: 0, canStart: false
```

**Test**:
1. Counter shows "8/8 sessions today"
2. Tap "Start" → **Upgrade modal immediately**
3. Modal shows:
   - Title: "Daily Limit Reached"
   - Message: "You've used 8 of 8 free sessions today"
   - Price: "$4.99"
   - Features list
   - "Upgrade to Premium" button
   - "Restore Purchases" button
   - "Maybe Later" button

---

### Scenario 5: Legacy User
**Expected**: Unlimited sessions, grandfathered

```javascript
// Simulate legacy user
await FreemiumService.simulateUserType('legacy');

const status = await FreemiumService.getStatus();
console.log(status);
// Should show: isLegacy: true, canStart: true, sessionsRemaining: Infinity
```

**Test**:
1. Start 20+ sessions → all work
2. No counter visible
3. No upgrade prompts
4. No limits

---

### Scenario 6: Purchase Flow
**Expected**: Purchase modal → sandbox purchase → unlimited access

**Note**: Requires RevenueCat product configuration (see IMPLEMENTATION_SUMMARY.md)

**Test**:
1. Trigger upgrade modal (hit 8-session limit)
2. Tap "Upgrade to Premium"
3. Loading indicator appears
4. iOS: Touch ID / Face ID prompt
5. Android: Google Play purchase dialog
6. Complete purchase (sandbox)
7. Alert: "🎉 Welcome to Premium!"
8. Modal closes
9. Counter disappears
10. Can start unlimited sessions

**Dev Testing (Without Product Setup)**:
```javascript
// Check purchase manager initialization
const PurchaseManager = require('./lib/purchases').PurchaseManager;
const manager = PurchaseManager.getInstance();
await manager.initialize();
// Check console for: [PURCHASES] Revenue Cat initialized successfully

// Try getting offerings (will fail until products configured)
try {
  const result = await manager.purchasePremium();
  console.log(result);
} catch (e) {
  console.log('Expected error until products configured:', e);
}
```

---

### Scenario 7: Restore Purchases
**Expected**: Reinstall → restore → premium restored

**Test**:
1. Purchase premium (Scenario 6)
2. Delete app
3. Reinstall app
4. Hit session limit (or trigger modal)
5. Tap "Restore Purchases"
6. Alert: "✅ Purchases Restored!"
7. Premium status restored
8. Unlimited access granted

---

### Scenario 8: Review Prompts
**Expected**: Native review prompt after milestones

```javascript
// Check review prompt status
const ReviewPromptService = require('./services/ReviewPromptService').default;
const status = await ReviewPromptService.getPromptStatus();
console.log(status);
```

**Test Triggers**:
1. **10 Sessions**: Complete 10 focus sessions → review prompt
2. **7-Day Anniversary**: Simulate 7 days later → review prompt
3. **Productive Day**: Complete 8 sessions in one day → review prompt

**Note**: Platform limits to 3 prompts per 365 days

---

## 📊 Status Checking Commands

Add these to your dev console for quick status checks:

```javascript
// Get comprehensive freemium status
const FreemiumService = require('./services/FreemiumService').default;
const status = await FreemiumService.getStatus();
console.table(status);

// Get session tracking status
const SessionTrackingService = require('./services/SessionTrackingService').default;
const sessionStatus = await SessionTrackingService.getStatus();
console.table(sessionStatus);

// Get review prompt status
const ReviewPromptService = require('./services/ReviewPromptService').default;
const reviewStatus = await ReviewPromptService.getPromptStatus();
console.table(reviewStatus);

// Get premium status
const PurchaseManager = require('./lib/purchases').PurchaseManager;
const premiumStatus = await PurchaseManager.getInstance().getPremiumStatus();
console.table(premiumStatus);
```

---

## 🔄 Reset Commands

```javascript
// Reset everything for fresh testing
const FreemiumService = require('./services/FreemiumService').default;
const SessionTrackingService = require('./services/SessionTrackingService').default;
const ReviewPromptService = require('./services/ReviewPromptService').default;
const PurchaseManager = require('./lib/purchases').PurchaseManager;

await SessionTrackingService.resetForTesting();
await ReviewPromptService.resetForTesting();
await PurchaseManager.getInstance().resetPremiumStatus();

console.log('✅ All tracking reset - app is now like a fresh install');
```

---

## 🐛 Debug Mode

The app includes extensive logging in `__DEV__` mode:

```
[FREEMIUM] Start session check: {...}
[SessionTracking] Initialized: {...}
[PURCHASES] Revenue Cat initialized successfully
[ANALYTICS] session_limit_warning
[NOTIF] Notification scheduled successfully
```

Check React Native debugger console for detailed logs.

---

## ⚠️ Known Limitations (Pre-Product Setup)

Until you configure products in RevenueCat, App Store Connect, and Google Play Console:

1. **Purchase will fail** with "No products available"
2. **Restore will fail** with "No purchases found"
3. All other features work perfectly (session limits, modals, tracking)

This is expected and will be resolved after product setup.

---

## ✅ Testing Checklist

Before submitting to stores:

- [ ] New user sees grace period message
- [ ] Grace period allows unlimited sessions
- [ ] After grace, limit enforces at 8 sessions/day
- [ ] Counter shows correct session count
- [ ] Upgrade modal appears at limit
- [ ] Purchase flow completes successfully
- [ ] Premium status persists after app restart
- [ ] Restore purchases works
- [ ] Legacy users have unlimited access
- [ ] Review prompts appear at milestones
- [ ] All analytics events fire correctly
- [ ] Session counter resets at midnight
- [ ] Splash screen shows properly
- [ ] Timer still works perfectly
- [ ] No crashes or errors

---

## 📱 Device Testing

Test on multiple devices:
- iOS simulator (latest iOS)
- Real iPhone (if available)
- Android emulator (latest Android)
- Real Android device (if available)

Test in different conditions:
- Fresh install
- App backgrounded/foregrounded
- Airplane mode (offline premium check)
- After midnight (session reset)
- Multiple days of use

---

## 🚨 If Something Goes Wrong

### "No products available"
→ Products not configured yet (see IMPLEMENTATION_SUMMARY.md Phase 1-3)

### "Purchases not initialized"
→ Check API keys in lib/purchases.ts (lines 66, 68)

### Sessions not counting
→ Check console for `[SessionTracking]` logs
→ Try: `await SessionTrackingService.incrementDailySession()`

### Modal not showing
→ Check: `await FreemiumService.canStartSession()`
→ Should return `canStart: false` when at limit

### Timer broken
→ Unlikely - we didn't touch timer logic
→ Test basic start/pause/stop functionality

---

**Ready to test!** Start with Scenario 1 (New User) and work through each scenario.
