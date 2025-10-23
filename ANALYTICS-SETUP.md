# Google Analytics Setup Guide

## ✅ What's Been Completed

### Mobile App (iOS & Android)
1. **Packages Installed**
   - `firebase` (v12.4.0)
   - `@react-native-firebase/app` (v23.4.1)
   - `@react-native-firebase/analytics` (v23.4.1)

2. **Configuration Files**
   - ✅ `google-services.json` copied to project root (Android)
   - ⚠️ `GoogleService-Info.plist` needs to be added (iOS - see below)

3. **App Configuration** (`app.json`)
   - Added Firebase Analytics plugins
   - Configured Android to use `google-services.json`
   - Configured iOS to use `GoogleService-Info.plist` (file needed)

4. **Analytics Service** (`services/AnalyticsService.js`)
   - Created comprehensive analytics service with methods for:
     - `logSessionStart(phase, duration)`
     - `logSessionComplete(phase, duration)`
     - `logSessionPause(phase, timeRemaining)`
     - `logSessionStop(phase, timeRemaining)`
     - `logSessionResume(phase, timeRemaining)`
     - `logScreenView(screenName)`
     - `setUserProperties(properties)`

5. **App Integration** (`App.js`)
   - Added analytics tracking to all key user actions:
     - Session starts (focus/break)
     - Session completions
     - Session pauses
     - Session stops
     - Session resumes

### Website (pomodoroflow.app)
1. **Google Analytics Added**
   - Added GA4 tracking code (G-4ZGMVWSG2V) to `index.html`
   - Added GA4 tracking code to `privacy.html`
   - Updated privacy policy to mention Google Analytics usage

---

## 🚨 Required: iOS Firebase Configuration

To enable analytics for iOS, you need to add the iOS Firebase configuration file:

### Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `pomodoroflow-9fe1a`
3. Go to Project Settings → General
4. Under "Your apps", find your iOS app or add one if it doesn't exist
5. Download the `GoogleService-Info.plist` file
6. Place it in the mobile app root directory:
   ```
   /Users/surfrrosa/projects/pomodoroflow/mobile-app/GoogleService-Info.plist
   ```

**Note:** The iOS bundle identifier should be: `com.surfrrosa.pomodoroflow`

---

## 📱 Testing Analytics

### Mobile App

1. **Rebuild the app** (required for native module changes):
   ```bash
   cd mobile-app

   # For iOS
   npx expo run:ios

   # For Android
   npx expo run:android
   ```

2. **Check console logs** (in development mode):
   - You'll see `[Analytics] Event logged: ...` messages
   - Verify events are being tracked

3. **View in Firebase Console**:
   - Go to Firebase Console → Analytics → Events
   - Events may take 24-48 hours to appear
   - For real-time testing, use DebugView:
     - iOS: Run app on simulator/device with `-FIRDebugEnabled` flag
     - Android: Run `adb shell setprop debug.firebase.analytics.app com.surfrrosa.pomodoroflow`

### Website

1. **Test immediately**:
   - Visit your website
   - Open browser DevTools → Network tab
   - Look for requests to `google-analytics.com` or `analytics.js`

2. **Use GA4 Real-Time Reports**:
   - Go to [Google Analytics](https://analytics.google.com/)
   - Select property for G-4ZGMVWSG2V
   - Go to Reports → Realtime
   - Visit your website and see yourself in real-time

---

## 📊 Events Being Tracked

### Mobile App Events
- `session_start` - When a focus or break session starts
  - Parameters: `session_type` (focus/break), `duration_seconds`
- `session_complete` - When a session completes successfully
  - Parameters: `session_type`, `duration_seconds`
- `session_pause` - When user pauses a session
  - Parameters: `session_type`, `time_remaining_seconds`
- `session_stop` - When user stops/cancels a session
  - Parameters: `session_type`, `time_remaining_seconds`
- `session_resume` - When user resumes a paused session
  - Parameters: `session_type`, `time_remaining_seconds`

### Website Events
- Automatic page views
- User interactions (tracked automatically by GA4)

---

## 🔧 Next Steps

1. ✅ **Add iOS configuration file** (see above)
2. ✅ **Rebuild the mobile app** to apply native changes
3. ✅ **Test analytics** on both platforms
4. ✅ **Deploy website** with new analytics code
5. 📊 **Set up custom dashboards** in Firebase/GA4 Console (optional)
6. 🔔 **Set up alerts** for important metrics (optional)

---

## 🐛 Troubleshooting

### Mobile App
- **Events not showing**: Make sure you've rebuilt the app (not just refreshed)
- **iOS not working**: Verify `GoogleService-Info.plist` is in the root directory
- **Android not working**: Verify `google-services.json` has correct package name

### Website
- **GA not loading**: Check browser console for errors
- **Ad blockers**: May block Google Analytics - test in incognito
- **Real-time not showing**: Wait a few seconds, refresh the Real-Time report

---

## 📚 Additional Resources

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [React Native Firebase Analytics](https://rnfirebase.io/analytics/usage)

---

**Questions?** Check the Firebase Console or review the implementation in:
- `mobile-app/services/AnalyticsService.js`
- `mobile-app/App.js` (lines with `AnalyticsService`)
