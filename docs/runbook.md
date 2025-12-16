# Development Runbook

> **Essential commands and workflows for PomodoroFlow development**

## Local Development

### Quick Start
```bash
cd mobile-app
npm install
npx expo start
```

### Development Modes
```bash
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser (limited functionality)
```

### Testing Notifications
```bash
# Enable notifications in dev
export NOTIFS_ENABLED=true
npm start

# Disable for debugging
export NOTIFS_ENABLED=false
npm start
```

## EAS Build & Deploy

### Prerequisites
```bash
npm install -g @expo/cli eas-cli
eas login
```

### Build Commands
```bash
# iOS builds
eas build --platform ios --profile preview
eas build --platform ios --profile production

# Android builds
eas build --platform android --profile preview
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Build Profiles (eas.json)
- **preview**: Internal testing, development signing
- **production**: App Store/Play Store submission

## Debugging

### Common Issues

**Notification Not Working**
```bash
# Check permissions
await Notifications.getPermissionsAsync()

# Reset notification state
await Notifications.cancelAllScheduledNotificationsAsync()
```

**Timer Drift in Background**
```bash
# Log time calculations
console.log('Expected:', expectedTime, 'Actual:', actualTime, 'Drift:', drift)
```

**AsyncStorage Corruption**
```bash
# Clear storage in dev
import AsyncStorage from '@react-native-async-storage/async-storage'
await AsyncStorage.clear()
```

### Performance Monitoring
```bash
# React Native performance monitor
npm install --save-dev @react-native-community/cli-platform-ios
npx react-native run-ios --configuration Release
```

## Testing

### Test Commands
```bash
npm test              # Unit tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Device Testing
1. **iOS**: Use real device for notification testing
2. **Android**: Test background timer with actual device
3. **Accessibility**: Enable VoiceOver/TalkBack

## Release Process

### Version Bump
```bash
# Update version in app.json and package.json
npm version patch|minor|major
```

### Release Checklist
- [ ] All tests passing
- [ ] Build succeeds on both platforms
- [ ] Notifications tested on device
- [ ] Accessibility verified
- [ ] Performance acceptable
- [ ] Privacy policy updated if needed

### Emergency Rollback
```bash
# Revert to previous EAS build
eas branch:list
eas update --branch production --message "Rollback to stable"
```

---

**Need Help?** Check [Expo docs](https://docs.expo.dev) or [open an issue](../../issues).