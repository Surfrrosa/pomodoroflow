# Firebase Setup Instructions

Firebase Analytics has been integrated into PomodoroFlow v1.0.3. Follow these steps to complete the setup.

## Prerequisites

- Firebase project created at https://console.firebase.google.com
- Bundle IDs configured:
  - **iOS**: `com.surfrrosa.pomodoroflow`
  - **Android**: `com.surfrrosa.pomodoroflow`

---

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: "PomodoroFlow" (or your preference)
4. Enable Google Analytics (recommended)
5. Complete project creation

---

## Step 2: Add iOS App

1. In Firebase Console, click "Add app" → iOS
2. Bundle ID: `com.surfrrosa.pomodoroflow`
3. App nickname: "PomodoroFlow iOS" (optional)
4. Download `GoogleService-Info.plist`
5. Place file in project root: `/mobile-app/GoogleService-Info.plist`

---

## Step 3: Add Android App

1. In Firebase Console, click "Add app" → Android
2. Package name: `com.surfrrosa.pomodoroflow`
3. App nickname: "PomodoroFlow Android" (optional)
4. Download `google-services.json`
5. Place file in project root: `/mobile-app/google-services.json`

---

## Step 4: Configure EAS Build (Expo)

Since this is an Expo managed workflow, Firebase config files need to be included in EAS builds.

Add to `.gitignore` (already done):
```
GoogleService-Info.plist
google-services.json
```

**For EAS Build**, the files will be automatically detected from the project root.

---

## Step 5: Enable Analytics in Firebase Console

1. Go to Firebase Console → Analytics
2. Analytics should auto-enable when first event is logged
3. Verify data is flowing within 24-48 hours of first app launch

---

## Step 6: Test Analytics (Development)

Analytics events are logged in `__DEV__` mode to the console:

```javascript
[Analytics] Event logged: session_complete { session_type: 'focus', duration_seconds: 1500 }
```

**Note**: Firebase Analytics **does not** send events in debug builds by default. Events are queued and sent only in production builds or when explicitly enabled.

To test analytics in development:
```bash
# iOS
adb shell setprop debug.firebase.analytics.app com.surfrrosa.pomodoroflow

# Android
adb shell setprop debug.firebase.analytics.app com.surfrrosa.pomodoroflow
```

---

## Step 7: Verify Setup

### Check Files

```bash
cd mobile-app
ls -la GoogleService-Info.plist  # Should exist
ls -la google-services.json      # Should exist
```

### Check app.json

Verify Firebase plugin is in `app.json`:

```json
"plugins": [
  [
    "expo-notifications",
    {
      "icon": "./assets/icon.png",
      "color": "#ffffff"
    }
  ],
  "@react-native-firebase/app"
]
```

### Build and Test

```bash
# Development build
eas build --profile development --platform ios

# Check logs after running app
# Look for: [Analytics] Event logged: ...
```

---

## Analytics Events

The app tracks these events:

### Session Events
- `session_start` - When Start pressed
- `session_complete` - When phase completes
- `session_pause` - When Pause pressed
- `session_stop` - When Stop pressed
- `session_resume` - When Resume pressed

### Monetization Events
- `upgrade_modal_shown` - Upgrade modal displayed
- `upgrade_modal_dismissed` - User closed modal
- `purchase_attempt` - User tapped purchase
- `purchase_success` - Purchase completed
- `purchase_failed` - Purchase failed
- `session_limit_warning` - User approaching limit
- `session_limit_reached` - User hit limit

### Review Events
- `review_prompt_attempted` - App requested review
- `review_prompt_shown` - Platform showed prompt

### Tip Jar Events
- `tip_jar_shown` - Tip jar modal displayed
- `tip_jar_dismissed` - User dismissed tip jar
- `tip_jar_donation` - User completed donation

---

## Troubleshooting

### "Firebase not initialized"

**Cause**: Config files missing or not detected
**Fix**: Ensure `GoogleService-Info.plist` and `google-services.json` are in project root

### "Events not showing in Firebase Console"

**Cause**: Analytics has 24-48 hour delay for first-time setup
**Fix**: Wait 24-48 hours, or use DebugView in Firebase Console

### "DebugView not showing events"

**Cause**: Debug mode not enabled
**Fix**: Run `adb shell setprop debug.firebase.analytics.app com.surfrrosa.pomodoroflow`

---

## Security Notes

- **Never commit** Firebase config files to public repos
- Config files contain API keys (safe for mobile apps, but keep private)
- Use Firebase Security Rules to protect data
- Enable App Check for additional security (optional)

---

## Next Steps After Setup

1. ✅ Verify analytics events in Firebase Console (wait 24-48h)
2. ✅ Set up conversions in Firebase → Analytics → Events
3. ✅ Configure Firebase App Check (optional security layer)
4. ✅ Set up BigQuery export for advanced analytics (optional)

---

**Setup Complete!** 🎉

Firebase Analytics will now track user engagement, conversions, and help optimize the freemium funnel.
