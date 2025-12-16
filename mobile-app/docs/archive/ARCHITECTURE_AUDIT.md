# PomodoroFlow Mobile App - Complete Architecture Audit
**Date:** October 28, 2025
**Version:** v1.0.1 (Current Production)
**Purpose:** Pre-monetization analysis for v1.0.2

---

## 📋 EXECUTIVE SUMMARY

**Current State:**
- ✅ Production app live on iOS App Store and Google Play Store
- ✅ Fully functional Pomodoro timer (25min focus / 5min break)
- ✅ Background notifications working
- ✅ State persistence across app restarts
- ✅ Analytics tracking (Firebase)
- ✅ Comprehensive test coverage (212 lines of tests)

**Key Finding:**
The app uses a **simple, direct implementation** in `App.js` (372 lines), NOT the complex `PomodoroTimer` class in `lib/timer.ts`. The `lib/` files appear to be **unused/experimental code**.

**Safety Assessment:**
- ✅ Clean separation of concerns
- ✅ No existing session limiting logic
- ✅ No active premium code (commented out for v1.0)
- ✅ AsyncStorage keys are well-organized
- ⚠️ Review prompts added but not yet deployed

---

## 🏗️ ARCHITECTURE OVERVIEW

### Primary Implementation: App.js

**Pattern:** Single-file React functional component with hooks
**Lines of Code:** 372 lines
**State Management:** React useState + refs
**Persistence:** AsyncStorage
**Timer Pattern:** setInterval with drift compensation

#### Core State Variables (App.js:28-34)

```javascript
const [phase, setPhase] = useState("focus");        // "focus" | "break"
const [running, setRunning] = useState(false);      // timer running status
const [fast, setFast] = useState(__DEV__);          // dev fast mode
const [phaseEndAt, setPhaseEndAt] = useState(null); // epoch ms when phase ends
const [remaining, setRemaining] = useState(0);       // seconds left for display
```

**Key Refs:**
- `endAtRef` - Read by interval without re-rendering
- `notificationIdRef` - Currently scheduled local notification ID
- `lastScheduleKeyRef` - Prevent duplicate scheduling
- `appState` - Track app foreground/background state
- `soundRef` - Audio sound object

---

## 📂 FILE STRUCTURE & USAGE

### Active Production Code

| File | Lines | Status | Purpose |
|------|-------|--------|---------|
| `App.js` | 372 | ✅ ACTIVE | Main app, timer logic, UI |
| `services/AnalyticsService.js` | 131 | ✅ ACTIVE | Firebase analytics wrapper |
| `services/ReviewPromptService.js` | 295 | ✅ NEW | Review prompts (v1.0.2) |
| `components/SplashScreen.tsx` | 212 | ✅ ACTIVE | Splash screen animation |
| `components/Timer.js` | 47 | ❌ UNUSED | Separate timer component (not imported) |
| `components/Controls.js` | 43 | ❌ UNUSED | Separate controls component (not imported) |
| `components/SessionIndicator.js` | 50 | ❌ UNUSED | Session dots indicator (not imported) |

### Monetization Infrastructure (Ready, Not Active)

| File | Lines | Status | Purpose |
|------|-------|--------|---------|
| `lib/purchases.ts` | 233 | 📦 READY | RevenueCat wrapper |
| `components/PremiumProvider.tsx` | 106 | 📦 READY | React context for premium state |
| `components/UpgradePrompt.tsx` | 266 | 📦 READY | Upgrade modal UI |
| `components/PremiumApp.js` | 51 | 📦 READY | Premium-aware app wrapper |

### Unused/Experimental Code

| File | Lines | Status | Purpose |
|------|-------|--------|---------|
| `lib/timer.ts` | 426 | ❌ UNUSED | Complex timer class (not imported) |
| `services/TimerService.js` | 135 | ❌ UNUSED | Alternative timer service (not imported) |
| `types/timer.ts` | ~50 | ❌ UNUSED | TypeScript types for lib/timer.ts |

**Critical Finding:**
`App.js` does NOT import `lib/timer.ts`, `services/TimerService.js`, or the component files. These exist but are not used in production.

---

## 💾 ASYNCSTORAGE KEY REGISTRY

### Currently Active Keys

```javascript
// Timer State (App.js line 19)
'pomodoroflow_state' → { phase, phaseStartAt, phaseEndAt }

// Review Prompts (ReviewPromptService.js lines 10-14)
'@pomodoroflow:review_prompt_count'     → number (0-3)
'@pomodoroflow:review_last_prompt_date' → timestamp
'@pomodoroflow:review_total_sessions'   → number
'@pomodoroflow:install_date'            → timestamp
'@pomodoroflow:review_version_prompted' → version string
```

### Ready for v1.0.2 (Not Yet Active)

```javascript
// Premium Status (lib/purchases.ts lines 10-12)
'@pomodoroflow:is_premium'         → 'true' | 'false'
'@pomodoroflow:daily_sessions'     → number
'@pomodoroflow:last_session_date'  → date string

// User ID for RevenueCat (lib/purchases.ts line 216)
'@pomodoroflow:user_id' → unique string
```

### Unused (lib/timer.ts - Not Active)

```javascript
// These keys are NEVER written by production code
'@pomodoroflow:timer_data'      → unused
'@pomodoroflow:session_history' → unused
'@pomodoroflow:settings'        → unused
```

**Key Conflict Risk:** ⚠️ LOW
- New keys use `@pomodoroflow:` prefix
- Old key uses plain `pomodoroflow_state`
- No naming conflicts

---

## 🔄 TIMER LOGIC FLOW

### Startup Sequence (App.js lines 48-114)

```
1. initializeApp()
   ├─ Cancel all notifications
   ├─ Configure notification channel (Android)
   └─ Request permissions

2. loadState()
   ├─ Read 'pomodoroflow_state' from AsyncStorage
   ├─ Calculate time remaining based on phaseEndAt
   ├─ Restore running state if timer hasn't expired
   └─ Set initial state if no stored data

3. Load chime sound (expo-av)
4. Register notification listeners
5. Setup AppState change handler (background compensation)
```

### Session Flow

```
User presses "Start"
  ↓
startPhase("focus")
  ├─ Calculate end time: Date.now() + 25*60*1000
  ├─ Save to AsyncStorage
  ├─ Schedule notification for phase end
  └─ Start setInterval (250ms ticks)

Every 250ms:
  ├─ Calculate remaining = (phaseEndAt - Date.now()) / 1000
  ├─ Update UI display
  └─ Check if time <= 0

When time reaches 0:
  ├─ Play chime sound
  ├─ Trigger haptic feedback
  ├─ Log analytics (sessionComplete)
  ├─ INCREMENT REVIEW PROMPT COUNTER ← NEW in v1.0.2
  ├─ Cancel existing notification
  └─ Transition to next phase (break)

Phase transitions:
  focus → break → focus → break → ...
  (no long break implemented yet)
```

### Background Handling

```javascript
// When app goes to background (App.js lines 151-159)
AppState.addEventListener("change", (next) => {
  if (next === "active" && phaseEndAt) {
    // Recalculate time remaining based on wall clock
    setRemaining(Math.max(0, Math.floor((phaseEndAt - Date.now()) / 1000)));
  }
});
```

**Drift Compensation:** Uses `phaseEndAt` timestamp, not elapsed time counting.
**Result:** Timer accurate even after app backgrounded for hours.

---

## 🔔 NOTIFICATION SYSTEM

### Implementation (App.js lines 161-217)

**Pattern:**
1. Cancel all existing notifications before scheduling new
2. Schedule single notification at phase end
3. Track notification ID in ref to prevent duplicates

```javascript
// scheduleOnce() - Line 175
const key = `${label}-${Math.floor(endTime / 1000)}`;
if (lastScheduleKeyRef.current === key) {
  return; // Prevent duplicate
}

await cancelNotification(); // Clear existing
const id = await Notifications.scheduleNotificationAsync({
  content: { title, body, sound: true },
  trigger: { type: 'date', date: new Date(endTime) },
});
```

**Notification Timing:**
- Scheduled when phase starts
- Content describes NEXT phase ("Break time!" or "Focus time!")
- If paused/resumed: cancel and reschedule

**Edge Case Handling:**
- Multiple pause/resume: Uses `lastScheduleKeyRef` to dedupe
- App restart: Notifications canceled in initializeApp()
- Timer stop: Cancels all notifications

---

## 📊 ANALYTICS TRACKING

### Current Events (AnalyticsService.js)

```javascript
logSessionStart(phase, duration)     // When Start pressed
logSessionComplete(phase, duration)  // When phase completes ← TRIGGERS REVIEW PROMPT
logSessionPause(phase, timeRemaining)
logSessionStop(phase, timeRemaining)
logSessionResume(phase, timeRemaining)
logScreenView(screenName)
setUserProperties(properties)
```

### New Events for v1.0.2 (lines 129-225)

```javascript
// Monetization
logUpgradeModalShown(trigger, sessionCount, daysSinceInstall)
logUpgradeModalDismissed(trigger, timeSpent)
logPurchaseAttempt(productId, price)
logPurchaseSuccess(productId, price, sessionCount)
logPurchaseFailed(productId, reason)
logRestorePurchasesAttempt()
logRestorePurchasesSuccess()

// Freemium
logSessionLimitWarning(sessionsRemaining)  // At 6 sessions
logSessionLimitReached(isPremium)          // At 8 sessions
```

**Integration Point:**
- Review prompts track automatically via `ReviewPromptService`
- Monetization events need manual calls from purchase flow

---

## 🧪 TEST COVERAGE

### Current Tests (__tests__/App.test.js)

**Coverage:** 212 lines, 10 test cases

```javascript
✅ renders initial state correctly
✅ starts focus phase when Start button is pressed
✅ pauses and resumes timer correctly
✅ stops timer and resets to initial state
✅ transitions from focus to break phase automatically
✅ persists state to AsyncStorage
✅ restores state from AsyncStorage on app start
✅ toggles dev fast mode correctly
✅ prevents duplicate notification scheduling
```

**Mocked Dependencies:**
- expo-notifications (full mock)
- AsyncStorage (full mock)
- Date.now() (controlled timestamps)

**Test Quality:** ⭐⭐⭐⭐⭐ Excellent
- Uses `act()` and `waitFor()` properly
- Tests async state updates
- Verifies notification scheduling
- Tests persistence and restoration
- No test failures reported

**Gap:** No tests for premium/monetization features (none exist yet)

---

## 🚫 PREMIUM CODE (COMMENTED OUT)

### Lines 37-38 (State variables)

```javascript
// Premium features removed for v1.0 - see v1.1-features.md for reimplementation
// const [isPremium, setIsPremium] = useState(false);
// const [dailySessions, setDailySessions] = useState(0);
// const [showUpgrade, setShowUpgrade] = useState(false);
```

### Lines 110-111 (loadPremiumStatus function)

```javascript
// Premium status loading removed for v1.0
// const loadPremiumStatus = async () => { ... };
```

### Lines 234-237 (onStart function - session limiting)

```javascript
// Session limiting removed for v1.0 - unlimited sessions for all users
startPhase("focus");
```

**Why Removed:** v1.0.0 was rejected by Apple for having session limits with non-functional IAP.

**Current State:** App has ZERO session tracking or limiting. Every user has unlimited sessions.

---

## 🔐 SECURITY & PRIVACY

### Data Collection

**Currently Collected:**
- Firebase Analytics events (session timing, phase transitions)
- No personally identifiable information (PII)
- No user accounts or emails

**After v1.0.2:**
- RevenueCat anonymous user ID (generated locally)
- Purchase transactions (handled by Apple/Google, not stored locally)
- Premium status (boolean, cached locally)

### API Keys

**Exposed in Code:**
- `google-services.json` - Firebase config (iOS)
- `GoogleService-Info.plist` - Firebase config (Android)

**Not Yet Added:**
- RevenueCat API key (placeholder in `lib/purchases.ts` line 39)

**Security Note:** Firebase config files are safe to commit (public API keys, secured by app bundle ID).

---

## ⚠️ CRITICAL DEPENDENCIES

### Production Dependencies (package.json)

```json
{
  "@react-native-async-storage/async-storage": "2.2.0",  // Storage
  "@react-native-firebase/analytics": "^23.4.1",         // Analytics
  "@react-native-firebase/app": "^23.4.1",               // Firebase core
  "expo": "~54.0.0",                                     // Framework
  "expo-av": "~16.0.7",                                  // Audio (chime)
  "expo-constants": "~18.0.9",                           // App constants
  "expo-haptics": "~15.0.7",                             // Haptic feedback
  "expo-notifications": "~0.32.11",                      // Notifications
  "expo-store-review": "~9.0.8",                         // ✅ NEW: Review prompts
  "react": "19.1.0",
  "react-native": "0.81.4"
}
```

### Missing (Needed for Monetization)

```bash
npm install react-native-purchases  # RevenueCat SDK
```

**Version Recommendation:** Latest stable (check RevenueCat docs)

---

## 🎯 INTEGRATION POINTS FOR MONETIZATION

### 1. Session Tracking (Currently Non-Existent)

**Needed:**
- Counter for daily sessions (resets at midnight)
- Total session counter (for review prompts - ✅ already added)
- Install date detection (✅ already added by ReviewPromptService)

**Current Gap:**
App has NO concept of "daily sessions". The `@pomodoroflow:daily_sessions` key exists in `lib/purchases.ts` but is never written by `App.js`.

**Where to Add:**
```javascript
// App.js line 289 (after logSessionComplete)
if (completedPhase === "focus") {
  await ReviewPromptService.incrementTotalSessions(); // ✅ Already added
  await incrementDailySessionCount(); // ← NEED TO ADD THIS
}
```

### 2. Premium Status Check (Currently Bypassed)

**Needed:**
- Load premium status on app start
- Check before starting session (if implementing limits)
- Cache status locally for offline use

**Where to Add:**
```javascript
// App.js line 108 (in useEffect after loadState)
const premiumStatus = await PurchaseManager.getInstance().getPremiumStatus();
setPremiumStatus(premiumStatus); // New state variable needed
```

### 3. Upgrade Modal Trigger

**Needed:**
- Detect when user hits session limit
- Show `UpgradePrompt` component
- Handle purchase success/failure

**Where to Add:**
```javascript
// App.js line 239 (in onStart function)
const onStart = async () => {
  const canStart = await checkSessionLimit(); // NEW
  if (!canStart) {
    setShowUpgradeModal(true); // NEW
    return;
  }
  startPhase("focus");
};
```

### 4. Existing User Detection

**Critical for Grandfathering:**

```javascript
// Check if user installed before v1.0.2
const installDate = await AsyncStorage.getItem('@pomodoroflow:install_date');
if (!installDate) {
  // First launch of v1.0.2 - check if they had old state
  const oldState = await AsyncStorage.getItem('pomodoroflow_state');
  if (oldState) {
    // They used v1.0.0 or v1.0.1 - mark as legacy user
    await AsyncStorage.setItem('@pomodoroflow:legacy_user', 'true');
    await AsyncStorage.setItem('@pomodoroflow:install_date', Date.now().toString());
  }
}
```

---

## 🔍 CODE QUALITY ASSESSMENT

### Strengths ✅

1. **Simple & Maintainable:** Single-file app, easy to understand
2. **Well-Tested:** Comprehensive test coverage with good patterns
3. **Defensive Coding:** Try/catch blocks, fallback values
4. **Clean Separation:** Services separate from UI
5. **Good Comments:** Key sections explained
6. **TypeScript Ready:** Some files already .ts/.tsx

### Weaknesses ⚠️

1. **Unused Code:** `lib/timer.ts`, `services/TimerService.js`, component files not imported
2. **No TypeScript in Main:** `App.js` is JavaScript (could be TypeScript)
3. **Large Single File:** 372 lines in one file (not terrible, but could split)
4. **No Session Tracking:** No daily session counter currently implemented
5. **Dev Mode Toggle:** Exposed in production UI (line 327-333)

### Refactoring Recommendations (After v1.0.2)

1. ✅ Keep `App.js` as-is for v1.0.2 (don't refactor during monetization)
2. Consider migrating to TypeScript (App.tsx) in v1.0.3
3. Remove or hide dev fast mode toggle in production
4. Delete unused files (`lib/timer.ts`, etc.) to reduce confusion
5. Extract premium logic to `usePremium()` custom hook

---

## 🛣️ IMPLEMENTATION STRATEGY FOR v1.0.2

### Phase 1: Infrastructure (No Behavior Changes)

**Goal:** Add monetization code WITHOUT affecting existing users

```javascript
// 1. Install RevenueCat
npm install react-native-purchases

// 2. Add daily session tracking (write only, no limits yet)
const incrementDailySessionCount = async () => {
  const stored = await AsyncStorage.getItem('@pomodoroflow:daily_sessions');
  const lastDate = await AsyncStorage.getItem('@pomodoroflow:last_session_date');
  const today = new Date().toDateString();

  if (lastDate !== today) {
    // New day - reset
    await AsyncStorage.setItem('@pomodoroflow:daily_sessions', '1');
    await AsyncStorage.setItem('@pomodoroflow:last_session_date', today);
  } else {
    // Increment
    const count = parseInt(stored || '0', 10);
    await AsyncStorage.setItem('@pomodoroflow:daily_sessions', (count + 1).toString());
  }
};

// 3. Add to onSessionComplete (line 289)
if (completedPhase === "focus") {
  await ReviewPromptService.incrementTotalSessions();
  await incrementDailySessionCount(); // NEW - just tracking, no enforcement
}
```

**Testing:** App works identically, but now tracks sessions in background.

### Phase 2: Grandfather Existing Users

```javascript
// Detect legacy users on first launch of v1.0.2
const detectLegacyUser = async () => {
  const legacyFlag = await AsyncStorage.getItem('@pomodoroflow:legacy_user');
  if (legacyFlag !== null) return; // Already checked

  const installDate = await AsyncStorage.getItem('@pomodoroflow:install_date');
  if (!installDate) {
    // First launch - check if they have old state
    const oldState = await AsyncStorage.getItem('pomodoroflow_state');
    if (oldState) {
      // Existing user from v1.0.0/v1.0.1
      await AsyncStorage.setItem('@pomodoroflow:legacy_user', 'true');
      console.log('[Monetization] Marked as legacy user (unlimited forever)');
    }
  }
};
```

### Phase 3: Apply Limits (New Users Only)

```javascript
// Check if user can start a session
const canStartSession = async () => {
  // Check if legacy user
  const isLegacy = await AsyncStorage.getItem('@pomodoroflow:legacy_user');
  if (isLegacy === 'true') {
    return true; // Legacy users = unlimited
  }

  // Check if premium
  const isPremium = await PurchaseManager.getInstance().checkPremiumStatus();
  if (isPremium) {
    return true; // Premium users = unlimited
  }

  // Check grace period (first 7 days)
  const installDate = await AsyncStorage.getItem('@pomodoroflow:install_date');
  const daysSinceInstall = (Date.now() - parseInt(installDate)) / (1000 * 60 * 60 * 24);
  if (daysSinceInstall < 7) {
    return true; // Grace period = unlimited
  }

  // Check daily limit (8 sessions)
  const dailySessions = parseInt(
    await AsyncStorage.getItem('@pomodoroflow:daily_sessions') || '0',
    10
  );

  if (dailySessions < 8) {
    return true; // Under limit
  }

  // Hit limit - show upgrade prompt
  return false;
};
```

### Phase 4: Add UI for Premium

```javascript
// Add state variables
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [premiumStatus, setPremiumStatus] = useState(null);

// Modify onStart
const onStart = async () => {
  const canStart = await canStartSession();
  if (!canStart) {
    setShowUpgradeModal(true);
    await AnalyticsService.logSessionLimitReached(false);
    return; // Don't start session
  }
  startPhase("focus");
};

// Add modal to JSX (before closing View)
{showUpgradeModal && (
  <UpgradePrompt
    visible={showUpgradeModal}
    onClose={() => setShowUpgradeModal(false)}
    trigger="session_limit"
  />
)}
```

---

## ✅ SAFETY CHECKLIST

Before implementing any changes:

### Code Safety
- [ ] All new code wrapped in try/catch
- [ ] Fallback values for all AsyncStorage reads
- [ ] RevenueCat failures don't break app
- [ ] Existing timer logic UNTOUCHED
- [ ] Tests still pass

### User Safety
- [ ] Legacy users identified correctly
- [ ] No session tracking for existing users (if grandfathered)
- [ ] Grace period working for new users
- [ ] Purchase flow fully functional before enforcement
- [ ] "Restore Purchases" button present

### App Store Compliance
- [ ] RevenueCat API key is REAL (not placeholder)
- [ ] IAP products configured in App Store Connect
- [ ] Privacy policy updated (mention purchases)
- [ ] Terms of use added
- [ ] No forced ratings (using StoreReview API)

---

## 📊 METRICS TO TRACK

### Pre-Launch (v1.0.1)
- Current daily active users (DAU)
- Current session completion rate
- Current average sessions per user per day
- Current retention (1-day, 7-day, 30-day)
- Current star rating

### Post-Launch (v1.0.2)
- Review prompt show rate (attempted vs shown)
- Review conversion rate (shown vs reviews left)
- Session limit reach rate (% of users hitting 8/day)
- Upgrade modal show rate
- Purchase conversion rate (modal shown → purchase)
- Legacy user retention (did we keep them?)
- New user retention (with limits)
- Revenue per 1000 users

---

## 🚀 DEPLOYMENT PLAN

### Pre-Deployment
1. ✅ Review prompts added (already done)
2. Create RevenueCat account
3. Configure IAP products in App Store Connect
4. Configure IAP products in Google Play Console
5. Get RevenueCat API keys
6. Test purchase flow in Sandbox (iOS + Android)
7. Test with TestFlight beta testers
8. Monitor for crashes/errors

### Deployment
1. Increment version: 1.0.1 → 1.0.2
2. Update "What's New" text
3. Build with EAS Build
4. Submit to App Store (iOS)
5. Submit to Play Store (Android)
6. Monitor Firebase Analytics for errors

### Post-Deployment
1. Monitor review prompts (are they showing?)
2. Monitor upgrade modal (is it appearing correctly?)
3. Monitor conversion rate (are people buying?)
4. Check for negative reviews (existing users angry?)
5. Watch for crashes (RevenueCat integration issues?)

### Rollback Plan
If things go wrong:
1. Use EAS Update to disable session limits remotely
2. Or submit emergency v1.0.3 with limits removed
3. Refund any affected users
4. Apologize in update notes

---

## 🎯 CRITICAL QUESTIONS TO ANSWER

Before implementing, you must decide:

### 1. Grandfather Existing Users?

**Option A:** YES - Existing users unlimited forever
**Option B:** NO - Everyone gets limits starting v1.0.2

**Recommendation:** Option A (safer, builds goodwill)

### 2. Session Limit for Free Users?

**Option A:** 8 sessions/day (4 full Pomodoro cycles)
**Option B:** 5 sessions/day (as in v1.1-features.md)
**Option C:** 10 sessions/day (more generous)

**Recommendation:** 8 sessions (balanced)

### 3. Grace Period for New Users?

**Option A:** 7 days unlimited (recommended)
**Option B:** 14 days unlimited (very generous)
**Option C:** No grace period (risky)

**Recommendation:** 7 days

### 4. Price Point?

**You decided:** $4.99 (no A/B testing)

### 5. When to Ship?

**This week?** Depends on:
- Do you have RevenueCat account ready?
- Are IAP products configured?
- Have you tested in Sandbox?
- Do you have time for TestFlight testing?

**Recommendation:** Allow 1 week for setup + testing

---

## 📝 NEXT STEPS

1. **Answer the 5 critical questions above**
2. I will implement based on your decisions
3. We will test thoroughly before submission
4. Monitor metrics post-launch
5. Iterate based on data

---

## 🔖 SUMMARY

**Architecture:** ✅ Clean, simple, maintainable
**Readiness:** ✅ Monetization infrastructure 80% complete
**Risk Level:** 🟢 LOW (if we grandfather existing users)
**Timeline:** 1 week to implement + test + deploy

**Key Insight:**
The app is well-architected for adding monetization. The review prompt system is already integrated. The purchase infrastructure exists but needs activation. The biggest decision is how to handle existing users.

**Recommended Approach:**
1. Grandfather existing users (unlimited forever)
2. Add 7-day grace period for new users
3. 8 sessions/day limit after grace
4. $4.99 one-time purchase
5. Monitor metrics closely

Ready to proceed when you answer the critical questions!
