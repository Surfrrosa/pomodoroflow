# Accessibility Checklist

> **VoiceOver/TalkBack compliance for App Store approval**

## Screen Reader Support

### Interactive Elements
- [ ] **Timer Display**: Announces current time and phase
  ```jsx
  accessibilityLabel="25 minutes remaining in focus session"
  accessibilityLiveRegion="polite"
  ```

- [ ] **Start Button**: Clear action description
  ```jsx
  accessibilityLabel="Start timer"
  accessibilityHint="Begins 25-minute focus session"
  accessibilityRole="button"
  ```

- [ ] **Pause Button**: State-aware labeling
  ```jsx
  accessibilityLabel={isRunning ? "Pause timer" : "Resume timer"}
  ```

- [ ] **Reset Button**: Confirmation context
  ```jsx
  accessibilityLabel="Reset timer"
  accessibilityHint="Stops current session and returns to start"
  ```

### Progress Indicators
- [ ] **Session Dots**: Meaningful progress description
  ```jsx
  accessibilityLabel="Session 2 of 4 complete"
  accessibilityRole="progressbar"
  ```

## Touch Targets

### Minimum Size Requirements
- [ ] **All buttons**: Minimum 44x44 points
- [ ] **Timer display**: Tappable for additional info
- [ ] **Session indicators**: Adequate spacing

### Implementation
```jsx
const styles = StyleSheet.create({
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
```

## Motion & Animation

### Reduced Motion Support
- [ ] **Check system preference**
  ```jsx
  import { AccessibilityInfo } from 'react-native';
  const prefersReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
  ```

- [ ] **Conditional animations**
  ```jsx
  const animationConfig = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 300, easing: Easing.ease };
  ```

### Safe Animation Patterns
- [ ] **Timer transitions**: Respect motion preferences
- [ ] **Phase changes**: Gentle visual feedback
- [ ] **Progress updates**: Smooth but optional

## Haptic Feedback

### Feedback Patterns
- [ ] **Timer start**: Light impact
  ```jsx
  import * as Haptics from 'expo-haptics';
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  ```

- [ ] **Session complete**: Medium impact
- [ ] **Break start**: Light impact
- [ ] **Long break**: Heavy impact

### Accessibility Settings
- [ ] **Respect system haptic settings**
- [ ] **Provide disable option in app settings**

## Focus Management

### Screen Reader Navigation
- [ ] **Logical focus order**: Timer → Controls → Progress
- [ ] **Focus restoration**: Return to relevant element after actions
- [ ] **Modal handling**: Trap focus in notifications/alerts

### Implementation
```jsx
const timerRef = useRef();

// Focus timer after state change
useEffect(() => {
  if (timerRef.current && isImportantUpdate) {
    AccessibilityInfo.setAccessibilityFocus(timerRef.current);
  }
}, [isImportantUpdate]);
```

## Testing Checklist

### iOS VoiceOver Testing
- [ ] **Enable VoiceOver**: Settings → Accessibility → VoiceOver
- [ ] **Navigate app**: Swipe right/left through all elements
- [ ] **Test actions**: Double-tap to activate buttons
- [ ] **Timer updates**: Verify announcements during countdown
- [ ] **Phase transitions**: Confirm break/work announcements

### Android TalkBack Testing
- [ ] **Enable TalkBack**: Settings → Accessibility → TalkBack
- [ ] **Navigate app**: Swipe through interface
- [ ] **Test gestures**: Tap and hold for context menu
- [ ] **Timer feedback**: Verify spoken updates
- [ ] **Notification accessibility**: Test notification announcements

### Manual Testing
- [ ] **Large text**: Test with system font scaling 200%+
- [ ] **High contrast**: Verify visibility with system contrast
- [ ] **Color blindness**: Ensure color isn't only way to convey info
- [ ] **One-handed use**: Verify reachability on large devices

## Common Accessibility Issues

### Avoid These Patterns
```jsx
// NO: Generic or missing labels
<Pressable accessibilityLabel="Button" />

// NO: No role specified
<View onPress={handlePress} />

// NO: Color-only status indication
<Text style={{color: isActive ? 'green' : 'red'}}>Status</Text>
```

### Better Patterns
```jsx
// YES: Descriptive labels
<Pressable
  accessibilityLabel="Start 25-minute focus session"
  accessibilityRole="button"
/>

// YES: Proper semantic roles
<Pressable
  accessibilityRole="button"
  accessibilityState={{selected: isActive}}
/>

// YES: Multiple status indicators
<Text accessibilityLabel={`Timer ${isActive ? 'running' : 'stopped'}`}>
  [{isActive ? 'ACTIVE' : 'INACTIVE'}] {statusText}
</Text>
```

## Compliance Requirements

### App Store Review Guidelines
- [ ] **Guideline 2.5.1**: Apps must be accessible
- [ ] **VoiceOver support**: All functionality accessible
- [ ] **Dynamic Type**: Support system font scaling
- [ ] **High Contrast**: Maintain 4.5:1 contrast ratio

### WCAG 2.1 AA Standards
- [ ] **Perceivable**: Text alternatives, contrast
- [ ] **Operable**: Keyboard accessible, no seizures
- [ ] **Understandable**: Readable, predictable
- [ ] **Robust**: Compatible with assistive technologies

---

**Testing Tools**:
- iOS: VoiceOver, Accessibility Inspector
- Android: TalkBack, Accessibility Scanner
- Cross-platform: Manual testing with real users