// mobile-app/services/FreemiumService.js
import SessionTrackingService from './SessionTrackingService';
import { PurchaseManager } from '../lib/purchases';
import { MONETIZATION_CONFIG } from '../config/monetization';

const { FREE_TIER_DAILY_LIMIT, GRACE_PERIOD_DAYS } = MONETIZATION_CONFIG;

/**
 * FreemiumService
 *
 * Central service for determining if a user can start a session.
 * Handles legacy users, premium users, grace period, and session limits.
 */
class FreemiumService {
  /**
   * Check if user can start a new focus session
   * Returns detailed status for UI decisions
   *
   * @returns {Promise<{
   *   canStart: boolean,
   *   reason: string,
   *   isLegacy: boolean,
   *   isPremium: boolean,
   *   inGracePeriod: boolean,
   *   dailySessions: number,
   *   sessionsRemaining: number
   * }>}
   */
  async canStartSession() {
    try {
      // 1. Check if legacy user (existing users from v1.0.0/v1.0.1)
      const isLegacy = await SessionTrackingService.isLegacyUser();
      if (isLegacy) {
        return {
          canStart: true,
          reason: 'legacy_user',
          isLegacy: true,
          isPremium: false,
          inGracePeriod: false,
          dailySessions: 0,
          sessionsRemaining: Infinity,
        };
      }

      // 2. Check if premium user
      const purchaseManager = PurchaseManager.getInstance();
      const isPremium = await purchaseManager.checkPremiumStatus();

      if (isPremium) {
        return {
          canStart: true,
          reason: 'premium_user',
          isLegacy: false,
          isPremium: true,
          inGracePeriod: false,
          dailySessions: 0,
          sessionsRemaining: Infinity,
        };
      }

      // 3. Check if in grace period (first 7 days)
      const inGracePeriod = await SessionTrackingService.isInGracePeriod();
      if (inGracePeriod) {
        return {
          canStart: true,
          reason: 'grace_period',
          isLegacy: false,
          isPremium: false,
          inGracePeriod: true,
          dailySessions: await SessionTrackingService.getDailySessionCount(),
          sessionsRemaining: Infinity,
        };
      }

      // 4. Check daily session limit (free users after grace period)
      const dailySessions = await SessionTrackingService.getDailySessionCount();
      const sessionsRemaining = Math.max(0, FREE_TIER_DAILY_LIMIT - dailySessions);

      if (dailySessions < FREE_TIER_DAILY_LIMIT) {
        return {
          canStart: true,
          reason: 'free_tier_ok',
          isLegacy: false,
          isPremium: false,
          inGracePeriod: false,
          dailySessions,
          sessionsRemaining,
        };
      }

      // 5. Hit daily limit
      return {
        canStart: false,
        reason: 'daily_limit_reached',
        isLegacy: false,
        isPremium: false,
        inGracePeriod: false,
        dailySessions,
        sessionsRemaining: 0,
      };
    } catch (error) {
      if (__DEV__) console.warn('[Freemium] Error checking session:', error);

      // Fail-safe: allow session on error (don't block users)
      return {
        canStart: true,
        reason: 'error_failsafe',
        isLegacy: false,
        isPremium: false,
        inGracePeriod: false,
        dailySessions: 0,
        sessionsRemaining: 0,
      };
    }
  }

  /**
   * Check if we should show a soft warning (approaching limit)
   * Show at 6 sessions (2 remaining)
   *
   * @returns {Promise<boolean>}
   */
  async shouldShowWarning() {
    try {
      const status = await this.canStartSession();

      // Don't show warning for unlimited users
      if (status.isLegacy || status.isPremium || status.inGracePeriod) {
        return false;
      }

      // Show warning at 6 sessions (2 remaining)
      return status.dailySessions === 6 && status.sessionsRemaining === 2;
    } catch {
      return false;
    }
  }

  /**
   * Get user-friendly status message for UI
   *
   * @returns {Promise<string>}
   */
  async getStatusMessage() {
    const status = await this.canStartSession();

    if (status.isLegacy) {
      return '✨ Legacy User - Unlimited Sessions';
    }

    if (status.isPremium) {
      return '⭐ Premium - Unlimited Sessions';
    }

    if (status.inGracePeriod) {
      const daysRemaining = GRACE_PERIOD_DAYS - await SessionTrackingService.getDaysSinceInstall();
      return `🎁 Trial: ${daysRemaining} days remaining`;
    }

    if (status.canStart) {
      return `📊 Free: ${status.dailySessions}/${FREE_TIER_DAILY_LIMIT} sessions today`;
    }

    return '🔒 Daily limit reached';
  }

  /**
   * Get comprehensive freemium status for debugging/analytics
   *
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const canStartResult = await this.canStartSession();
    const trackingStatus = await SessionTrackingService.getStatus();
    const statusMessage = await this.getStatusMessage();
    const shouldWarn = await this.shouldShowWarning();

    return {
      ...canStartResult,
      ...trackingStatus,
      statusMessage,
      shouldShowWarning: shouldWarn,
      freeTierLimit: FREE_TIER_DAILY_LIMIT,
      gracePeriodDays: GRACE_PERIOD_DAYS,
    };
  }

  /**
   * Development helper - simulate different user types
   */
  async simulateUserType(type) {
    if (!__DEV__) return;

    switch (type) {
      case 'legacy':
        await SessionTrackingService.simulateLegacyUser();
        console.log('[Freemium] Simulated legacy user');
        break;

      case 'new_grace':
        await SessionTrackingService.simulateNewUser(2); // 2 days ago
        console.log('[Freemium] Simulated new user in grace period');
        break;

      case 'new_after_grace':
        await SessionTrackingService.simulateNewUser(10); // 10 days ago
        console.log('[Freemium] Simulated new user after grace period');
        break;

      case 'near_limit':
        await SessionTrackingService.simulateNewUser(10);
        // Set daily sessions to 6
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('@pomodoroflow:daily_sessions', '6');
        await AsyncStorage.setItem('@pomodoroflow:last_session_date', new Date().toDateString());
        console.log('[Freemium] Simulated user near limit (6/8 sessions)');
        break;

      case 'at_limit':
        await SessionTrackingService.simulateNewUser(10);
        const AsyncStorage2 = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage2.setItem('@pomodoroflow:daily_sessions', '8');
        await AsyncStorage2.setItem('@pomodoroflow:last_session_date', new Date().toDateString());
        console.log('[Freemium] Simulated user at limit (8/8 sessions)');
        break;

      default:
        console.log('[Freemium] Unknown user type:', type);
    }
  }
}

export default new FreemiumService();
