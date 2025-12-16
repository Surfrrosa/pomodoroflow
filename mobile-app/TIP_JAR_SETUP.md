# Tip Jar Setup Instructions

Complete guide to configuring the donation/tip jar in-app purchases for PomodoroFlow v1.0.3.

## Overview

The tip jar uses **expo-in-app-purchases** for simple one-time donations:
- ☕ Coffee - $1.99 (Small thanks)
- 🍜 Lunch - $4.99 (Big thanks)
- 🎉 Supporter - $9.99 (Huge thanks)

These are **separate from** the Premium upgrade (which uses RevenueCat).

---

## Prerequisites

- **Apple Developer Account** (for iOS)
- **Google Play Console Account** (for Android)
- App submitted to App Store Connect / Play Console
- Bundle IDs configured:
  - iOS: `com.surfrrosa.pomodoroflow`
  - Android: `com.surfrrosa.pomodoroflow`

---

## iOS Setup (App Store Connect)

### Step 1: Configure In-App Purchases

1. Go to https://appstoreconnect.apple.com
2. Navigate to: **My Apps** → **PomodoroFlow** → **In-App Purchases**
3. Click **+** to create new products

### Step 2: Create Tip Products

Create 3 **Non-Consumable** products:

#### Coffee Tip
- **Product ID**: `com.surfrrosa.pomodoroflow.tip_coffee`
- **Reference Name**: "Tip Jar - Coffee"
- **Type**: Non-Consumable
- **Price**: $1.99 USD (Tier 2)
- **Display Name**: "Buy me a coffee ☕"
- **Description**: "Support PomodoroFlow development with a small donation. Thank you!"

#### Lunch Tip
- **Product ID**: `com.surfrrosa.pomodoroflow.tip_lunch`
- **Reference Name**: "Tip Jar - Lunch"
- **Type**: Non-Consumable
- **Price**: $4.99 USD (Tier 5)
- **Display Name**: "Buy me lunch 🍜"
- **Description**: "Support PomodoroFlow development with a generous donation. Thank you!"

#### Supporter Tip
- **Product ID**: `com.surfrrosa.pomodoroflow.tip_supporter`
- **Reference Name**: "Tip Jar - Supporter"
- **Type**: Non-Consumable
- **Price**: $9.99 USD (Tier 10)
- **Display Name**: "Become a Supporter 🎉"
- **Description**: "Support PomodoroFlow development with a huge donation. You're amazing!"

### Step 3: Submit Products for Review

1. Add screenshot (any app screenshot is fine)
2. Submit each product with app for review
3. Products must be "Ready to Submit" status

**Note**: Products are reviewed with the app. They won't be available until app is approved.

---

## Android Setup (Google Play Console)

### Step 1: Configure In-App Products

1. Go to https://play.google.com/console
2. Navigate to: **PomodoroFlow** → **Monetize** → **In-app products**
3. Click **Create product**

### Step 2: Create Tip Products

Create 3 **Managed products**:

#### Coffee Tip
- **Product ID**: `tip_coffee`
- **Name**: "Buy me a coffee"
- **Description**: "Support PomodoroFlow development with a small donation. Thank you!"
- **Price**: $1.99 USD
- **Status**: Active

#### Lunch Tip
- **Product ID**: `tip_lunch`
- **Name**: "Buy me lunch"
- **Description**: "Support PomodoroFlow development with a generous donation. Thank you!"
- **Price**: $4.99 USD
- **Status**: Active

#### Supporter Tip
- **Product ID**: `tip_supporter`
- **Name**: "Become a Supporter"
- **Description**: "Support PomodoroFlow development with a huge donation. You're amazing!"
- **Price**: $9.99 USD
- **Status**: Active

### Step 3: Activate Products

1. Set status to **Active** for each product
2. Products are immediately available (no separate review)

---

## Testing In-App Purchases

### iOS Testing (Sandbox)

1. **Create Sandbox Tester Account**:
   - App Store Connect → Users and Access → Sandbox Testers
   - Add new tester with unique email

2. **Configure Device**:
   - Settings → App Store → Sign Out
   - Launch PomodoroFlow
   - When prompted, sign in with sandbox account

3. **Test Purchases**:
   - Tap "💙 Support this app" or trigger tip jar modal
   - Complete purchase with sandbox account
   - Verify "Thank You" message appears
   - Check that `USER_HAS_DONATED` flag is set

**Important**:
- Never use real Apple ID for testing
- Sandbox purchases are free
- Receipts are fake (don't validate in production)

### Android Testing

1. **Add License Testers**:
   - Play Console → Setup → License testing
   - Add Gmail accounts for testers

2. **Configure Test Track**:
   - Release → Testing → Internal testing
   - Add testers
   - Download test app

3. **Test Purchases**:
   - Use license testing account
   - Purchases are free for testers
   - Can use reserved product ID `android.test.purchased` for instant testing

---

## Code Verification

### Check Product IDs in Code

Open `config/monetization.ts`:

```typescript
// iOS Product IDs
TIP_JAR_COFFEE_IOS: 'com.surfrrosa.pomodoroflow.tip_coffee',
TIP_JAR_LUNCH_IOS: 'com.surfrrosa.pomodoroflow.tip_lunch',
TIP_JAR_SUPPORTER_IOS: 'com.surfrrosa.pomodoroflow.tip_supporter',

// Android Product IDs
TIP_JAR_COFFEE_ANDROID: 'tip_coffee',
TIP_JAR_LUNCH_ANDROID: 'tip_lunch',
TIP_JAR_SUPPORTER_ANDROID: 'tip_supporter',

// Amounts
TIP_COFFEE_AMOUNT: 1.99,
TIP_LUNCH_AMOUNT: 4.99,
TIP_SUPPORTER_AMOUNT: 9.99,
```

**✅ These must match EXACTLY with App Store Connect / Play Console product IDs.**

---

## Tip Jar Behavior

### Triggers (Modal Prompts)

1. **Power User** (25 completed sessions)
   - Message: "You're crushing it! 🙏"

2. **30-Day Anniversary** (30 days + 15 sessions)
   - Message: "One month together! 🎉"

### Anti-Spam Safeguards

- Maximum 3 modal prompts (lifetime)
- After 2 dismissals, never shows modal again
- Won't show if user already donated
- 14-day cooldown between tip jar prompts
- 7-day cooldown after review prompts (never stacks)

### Always-Available Access

Users can always access tip jar via:
- **"💙 Support this app"** link at bottom of main screen
- No limits on manual access

---

## Analytics Tracking

Tip jar events are tracked in Firebase Analytics:

```javascript
// When shown
tip_jar_shown { trigger: 'power_user' | 'anniversary' }

// When dismissed
tip_jar_dismissed { trigger: 'power_user' | 'anniversary' }

// When donated
tip_jar_donation {
  amount: 1.99 | 4.99 | 9.99,
  trigger: 'power_user' | 'anniversary' | 'manual',
  value: amount,
  currency: 'USD'
}
```

Use Firebase Analytics to track:
- Conversion rates (shown → donated)
- Most popular tier
- Trigger effectiveness
- Revenue per user

---

## Troubleshooting

### "No products available"

**Cause**: Products not configured in App Store Connect / Play Console
**Fix**: Complete setup steps above, wait 1-2 hours for products to sync

### "Product not found"

**Cause**: Product IDs in code don't match store configuration
**Fix**: Verify IDs in `config/monetization.ts` match exactly

### "Purchase failed"

**iOS Cause**: Not signed in with sandbox account
**iOS Fix**: Sign out of App Store, test again

**Android Cause**: Not using license testing account
**Android Fix**: Add Gmail to license testers

### "User cancelled" every time

**Cause**: Sandbox account not configured
**Fix**: iOS - create sandbox tester; Android - add license tester

---

## Testing Checklist

- [ ] Created all 3 tip products in App Store Connect
- [ ] Created all 3 tip products in Play Console
- [ ] Product IDs match code exactly
- [ ] Prices are $1.99, $4.99, $9.99
- [ ] Sandbox account created (iOS)
- [ ] License tester added (Android)
- [ ] Test purchase completes successfully
- [ ] "Thank You" modal appears
- [ ] User can't purchase again (already donated)
- [ ] Analytics events logged correctly

---

## Production Checklist

Before submitting to stores:

- [ ] All tip products are "Ready to Submit" (iOS)
- [ ] All tip products are "Active" (Android)
- [ ] Test in TestFlight / Internal Testing
- [ ] Verify analytics in Firebase Console
- [ ] Test edge cases (poor network, cancelled purchases)
- [ ] Verify "Support this app" link works
- [ ] Test manual access (not just triggers)

---

## Revenue & Analytics

Monitor tip jar performance:

1. **App Store Connect** → Analytics → In-App Purchases
2. **Play Console** → Monetize → Overview
3. **Firebase Analytics** → Events → `tip_jar_donation`

Key metrics:
- Conversion rate (shown → donated)
- Average donation amount
- Most effective trigger
- Revenue per active user

---

**Setup Complete!** 🎉

Users can now support PomodoroFlow development with optional donations while keeping the app free for everyone.
