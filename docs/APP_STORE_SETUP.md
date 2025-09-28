# App Store Connect Setup Guide

## Step 1: Create App Store Connect Record

1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. **Click "My Apps" → "+" → "New App"**
3. **Fill in the details**:
   - **Platform**: iOS
   - **Name**: PomodoroFlow
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: `com.surfrrosa.pomodoroflow` (create new)
   - **SKU**: `pomodoroflow-2025` (your choice)
   - **User Access**: Limited Access

## Step 2: App Information

### General Information
- **Name**: PomodoroFlow
- **Subtitle**: Focus timer for productivity
- **Category**: Productivity
- **Secondary Category**: Utilities

### App Store Information
- **Keywords**: pomodoro, timer, focus, productivity, study, work
- **Support URL**: https://github.com/Surfrrosa/pomodoroflow
- **Marketing URL**: https://github.com/Surfrrosa/pomodoroflow
- **Privacy Policy URL**: https://github.com/Surfrrosa/pomodoroflow/blob/main/docs/PRIVACY_POLICY.md

### Build Information
- **Copyright**: 2025 [Your Name]
- **Trade Representative Contact**: [Your Info]
- **Age Rating**: 4+ (No Restricted Content)

## Step 3: Pricing and Availability

### Pricing
- **Price**: Free (with In-App Purchases)
- **Availability**: All territories
- **Pre-order**: No

### In-App Purchase Setup
1. **Go to "Features" → "In-App Purchases"**
2. **Click "+" → "Non-Consumable"**
3. **Product Details**:
   - **Reference Name**: Premium Upgrade
   - **Product ID**: `premium_upgrade`
   - **Price**: $4.99 (Tier 5)
   - **Display Name**: Premium Features
   - **Description**: Unlock unlimited sessions and premium features

## Step 4: App Description

### Description
```
Focus for 25 minutes, break for 5, repeat. No settings, no distractions.

PomodoroFlow brings radical simplicity to productivity timing. One tap to start, gentle chimes to guide you through your focus sessions.

CORE FEATURES:
• Standard Pomodoro cycles (25min focus, 5min break)
• Local notifications for session transitions
• Clean, distraction-free interface
• Session progress tracking
• Works completely offline

PREMIUM FEATURES ($4.99 one-time):
• Unlimited daily sessions
• Custom timer durations
• Session history and analytics
• Premium sounds and themes

PRIVACY FIRST:
• No data collection or tracking
• Everything stays on your device
• No account required
• Fully offline capable

Perfect for students, professionals, and anyone who wants to improve their focus and productivity.

Stay focused. Stay productive. Stay in your flow.
```

### What's New (Version 1.0)
```
🎉 Welcome to PomodoroFlow!

• Beautiful, minimal interface designed for focus
• Reliable local notifications
• Session tracking and progress indicators
• Premium upgrade with unlimited sessions
• Complete privacy - no data collection

Ready to transform your productivity? Start your first Pomodoro session today!
```

### Keywords
```
pomodoro,timer,focus,productivity,study,work,concentration,time management,break timer,session tracker
```

## Step 5: App Store Screenshots

**Required Sizes** (we'll generate these):
- **6.7" Display (iPhone 14 Pro Max)**: 1290 x 2796 pixels
- **6.5" Display (iPhone 11 Pro Max)**: 1242 x 2688 pixels
- **5.5" Display (iPhone 8 Plus)**: 1242 x 2208 pixels
- **12.9" iPad Pro**: 2048 x 2732 pixels

**Screenshot Ideas**:
1. Main timer screen (focus mode)
2. Break mode with notification
3. Session progress/history
4. Premium upgrade screen
5. Settings/preferences

## Step 6: App Icon

**Required Sizes**:
- **App Store**: 1024 x 1024 pixels
- **iPhone**: Multiple sizes (handled by Expo)
- **iPad**: Multiple sizes (handled by Expo)

## Step 7: App Review Information

### Contact Information
- **First Name**: [Your First Name]
- **Last Name**: [Your Last Name]
- **Phone Number**: [Your Phone]
- **Email**: [Your Email]

### Review Notes
```
Thank you for reviewing PomodoroFlow!

TESTING INSTRUCTIONS:
1. Launch the app - you'll see a beautiful splash screen
2. Tap "Start" to begin a 25-minute focus session
3. The timer counts down with a clean interface
4. Test notifications by using "Dev Fast Mode" (10-second timers)
5. Try starting 6 sessions to see the premium upgrade prompt

KEY FEATURES TO TEST:
• Timer functionality (start/pause/stop)
• Local notifications when sessions end
• Session limiting (5 free sessions per day)
• Premium upgrade flow ($4.99 one-time purchase)

PRIVACY:
• No data collection - everything local
• No network requests required
• Fully offline functional

The app is designed for radical simplicity and focus. No settings, no distractions, just pure productivity timing.
```

### Demo Account
- **Not Required** (no login system)

## Step 8: Build Upload

**After we configure EAS Build**:
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login with your Apple ID
eas login

# Configure build
eas build:configure

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

## Your Team Configuration

- **Apple Developer Team ID**: N2D7V2X3LA
- **Bundle Identifier**: com.surfrrosa.pomodoroflow
- **App Store Connect Account**: [Your Apple ID]

## Next Steps

1. ✅ Complete App Store Connect app creation
2. ⏳ Generate app icons and screenshots
3. ⏳ Configure EAS build credentials
4. ⏳ Build and submit for review

**Ready to create your app in App Store Connect with the information above!**