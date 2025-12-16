# PomodoroFlow Documentation

This directory contains comprehensive documentation for the PomodoroFlow mobile app.

---

## Quick Links

### Implementation & Strategy
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete implementation details for v1.0.2
- **[MONETIZATION_STRATEGY.md](./MONETIZATION_STRATEGY.md)** - Pricing strategy and market research
- **[QUALITY_REVIEW.md](./QUALITY_REVIEW.md)** - Production readiness assessment

### Testing & Development
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing scenarios and commands
- **[generate-assets.md](./generate-assets.md)** - Asset generation instructions

### Archived (Historical)
- **[archive/v1.1-features.md](./archive/v1.1-features.md)** - Old v1.1 planning doc (superseded by v1.0.2)
- **[archive/ARCHITECTURE_AUDIT.md](./archive/ARCHITECTURE_AUDIT.md)** - Pre-implementation audit (v1.0.1)

---

## Documentation Overview

### For Developers

**Getting Started:**
1. Read [../README.md](../README.md) - Project overview and setup
2. Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation details
3. Read [TESTING_GUIDE.md](./TESTING_GUIDE.md) - How to test the app

**Code Quality:**
- [QUALITY_REVIEW.md](./QUALITY_REVIEW.md) - Architecture decisions and quality metrics

**Strategy & Context:**
- [MONETIZATION_STRATEGY.md](./MONETIZATION_STRATEGY.md) - Why we chose $4.99, 8 sessions/day, etc.

### For Product/Business

**Strategy Documents:**
- [MONETIZATION_STRATEGY.md](./MONETIZATION_STRATEGY.md) - Market research, pricing psychology, revenue projections
- [QUALITY_REVIEW.md](./QUALITY_REVIEW.md) - Production readiness, App Store compliance

**What's New:**
- [../CHANGELOG.md](../CHANGELOG.md) - Version history and release notes

### For QA/Testing

**Testing:**
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - All testing scenarios, dev helpers, commands

**Status Checking:**
```bash
# Quick status check commands
npm run typecheck  # Should show: No TypeScript errors

# Test in simulator
npm run ios
npm run android
```

---

## Document Status

| Document | Version | Status | Last Updated |
|----------|---------|--------|--------------|
| README.md (root) | 1.0.2 | Current | v1.0.2 |
| CHANGELOG.md | 1.0.2 | Current | v1.0.2 |
| IMPLEMENTATION_SUMMARY.md | 1.0.2 | Current | v1.0.2 |
| QUALITY_REVIEW.md | 1.0.2 | Current | v1.0.2 |
| TESTING_GUIDE.md | 1.0.2 | Current | v1.0.2 |
| MONETIZATION_STRATEGY.md | 1.0.2 | Current | v1.0.2 (research) |
| generate-assets.md | 1.0.0 | Current | Stable |
| v1.1-features.md | Archived | Historical | Pre-v1.0.2 |
| ARCHITECTURE_AUDIT.md | Archived | Historical | Pre-v1.0.2 |

---

## Key Concepts

### Freemium Model (v1.0.2)

**User Types:**
1. **Legacy Users** - Existing users from v1.0.0/v1.0.1 (unlimited forever)
2. **New Users (Grace)** - First 7 days (unlimited)
3. **Free Users** - After grace (8 sessions/day)
4. **Premium Users** - After $4.99 purchase (unlimited)

**Session Limits:**
- Free tier: 8 sessions per day (4 complete Pomodoro cycles)
- Grace period: 7 days of unlimited access
- Daily reset: Midnight local time

### Review Prompts (v1.0.2)

**Triggers:**
1. After 10 completed focus sessions
2. On 7-day anniversary (if 5+ sessions)
3. After 8 sessions in one day (productive day)

**Limits:**
- 3 prompts per 365 days (platform-enforced)
- 90-day cooldown between prompts (app-enforced)

### Architecture Principles

**Single Source of Truth:**
- PremiumProvider (React Context) manages all freemium state
- App.js reads from PremiumProvider only (no direct service calls)
- Configuration centralized in `config/monetization.ts`

**Fail-Open Design:**
- All errors default to allowing sessions (never block users)
- Comprehensive try-catch blocks with safe fallbacks
- Offline premium status checking (AsyncStorage cache)

**DRY Principles:**
- One STORAGE_KEYS definition
- One pricing configuration
- One entitlement ID
- Zero hard-coded values

---

## Configuration

All monetization settings are in a single file:

**`config/monetization.ts`:**
```typescript
export const MONETIZATION_CONFIG = {
  FREE_TIER_DAILY_LIMIT: 8,
  GRACE_PERIOD_DAYS: 7,
  PREMIUM_PRICE_USD: 4.99,
  PREMIUM_PRICE_DISPLAY: '$4.99',
  // ... all other constants
};
```

To change limits, pricing, or triggers, edit this one file.

---

## Common Tasks

### Testing Different User Types

```javascript
const FreemiumService = require('./services/FreemiumService').default;

// Simulate new user in grace period
await FreemiumService.simulateUserType('new_grace');

// Simulate new user after grace
await FreemiumService.simulateUserType('new_after_grace');

// Simulate user at session limit
await FreemiumService.simulateUserType('at_limit');

// Simulate legacy user
await FreemiumService.simulateUserType('legacy');
```

### Checking Current Status

```javascript
// Get freemium status
const status = await FreemiumService.getStatus();
console.table(status);

// Get session tracking status
const SessionTrackingService = require('./services/SessionTrackingService').default;
const sessionStatus = await SessionTrackingService.getStatus();
console.table(sessionStatus);
```

### Resetting for Testing

```javascript
// Reset all tracking
await SessionTrackingService.resetForTesting();
await ReviewPromptService.resetForTesting();
await PurchaseManager.getInstance().resetPremiumStatus();
```

---

## Pre-Launch Checklist

See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md#-next-steps-before-shipping) for complete checklist.

**Quick Check:**
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] All documentation updated
- [ ] RevenueCat products configured
- [ ] IAP products in App Store Connect
- [ ] IAP products in Google Play Console
- [ ] Tested in sandbox environment
- [ ] Manual testing completed (all scenarios)

---

## Support & Contact

**Developer:** Shaina Pauley
**Repository:** Internal/Private
**Documentation Questions:** File an issue or contact dev team

---

## Contributing to Documentation

When adding or updating documentation:

1. **Keep it current** - Update docs when code changes
2. **Be specific** - Include line numbers, file paths, code examples
3. **Test examples** - Verify all code examples work
4. **Link related docs** - Connect related information
5. **Update this index** - Add new docs to the table above

**Documentation Standards:**
- Use markdown format (.md)
- Include code blocks with syntax highlighting
- Add table of contents for long documents
- Include "Last Updated" date
- Keep tone technical but accessible

---

## Document Templates

### For New Features

When adding a new feature, document:
1. **Purpose** - What problem does it solve?
2. **Implementation** - How is it implemented? (file paths, key functions)
3. **Configuration** - What can be configured?
4. **Testing** - How to test it?
5. **Analytics** - What events are tracked?

### For Bug Fixes

When documenting a bug fix:
1. **Bug Description** - What was broken?
2. **Root Cause** - Why did it happen?
3. **Fix** - What changed?
4. **Testing** - How to verify the fix?
5. **Prevention** - How to prevent similar bugs?

---

**Last Updated:** v1.0.2 Release
