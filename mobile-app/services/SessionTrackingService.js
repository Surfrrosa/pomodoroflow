// mobile-app/services/SessionTrackingService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, MONETIZATION_CONFIG } from '../config/monetization';

/**
 * SessionTrackingService
 *
 * Tracks daily session counts and manages legacy user detection.
 * Used for freemium limits and grandfathering existing users.
 */
class SessionTrackingService {
  /**
   * Initialize session tracking on app start
   * Detects legacy users and sets install date
   */
  async initialize() {
    try {
      await this.detectLegacyUser();
      await this.ensureInstallDate();
      await this.resetDailyCountIfNeeded();

      if (__DEV__) {
        const status = await this.getStatus();
        console.log('[SessionTracking] Initialized:', status);
      }
    } catch (error) {
      if (__DEV__) console.warn('[SessionTracking] Initialization failed:', error);
    }
  }

  /**
   * Detect if user is a legacy user (installed v1.0.0 or v1.0.1)
   * Legacy users get unlimited sessions forever (grandfathered)
   */
  async detectLegacyUser() {
    try {
      // Check if we've already done legacy detection
      const alreadyChecked = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_V102_LAUNCH);
      if (alreadyChecked) {
        return; // Already detected, don't re-check
      }

      // Mark that we've done v1.0.2 launch check
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_V102_LAUNCH, Date.now().toString());

      // Check if user has old timer state (from v1.0.0/v1.0.1)
      const oldState = await AsyncStorage.getItem(STORAGE_KEYS.TIMER_STATE);

      if (oldState) {
        // User has used the app before v1.0.2 - mark as legacy
        await AsyncStorage.setItem(STORAGE_KEYS.LEGACY_USER, 'true');
        if (__DEV__) {
          console.log('[SessionTracking] Legacy user detected - unlimited sessions granted');
        }
      } else {
        // New user starting with v1.0.2
        await AsyncStorage.setItem(STORAGE_KEYS.LEGACY_USER, 'false');
        if (__DEV__) {
          console.log('[SessionTracking] New user detected - freemium model applies');
        }
      }
    } catch (error) {
      if (__DEV__) console.warn('[SessionTracking] Legacy detection failed:', error);
      // Fail safe: mark as legacy to avoid blocking users on error
      await AsyncStorage.setItem(STORAGE_KEYS.LEGACY_USER, 'true');
    }
  }

  /**
   * Ensure install date is set
   * Used for grace period calculation
   */
  async ensureInstallDate() {
    try {
      let installDate = await AsyncStorage.getItem(STORAGE_KEYS.INSTALL_DATE);

      if (!installDate) {
        installDate = Date.now().toString();
        await AsyncStorage.setItem(STORAGE_KEYS.INSTALL_DATE, installDate);
        if (__DEV__) {
          console.log('[SessionTracking] Install date set:', new Date(parseInt(installDate, 10)));
        }
      }
    } catch (error) {
      if (__DEV__) console.warn('[SessionTracking] Failed to set install date:', error);
    }
  }

  /**
   * Reset daily session count if it's a new day
   */
  async resetDailyCountIfNeeded() {
    try {
      const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION_DATE);
      const today = new Date().toDateString();

      if (lastDate !== today) {
        // New day - reset counter
        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_SESSIONS, '0');
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SESSION_DATE, today);
        if (__DEV__) {
          console.log('[SessionTracking] Daily counter reset for new day:', today);
        }
      }
    } catch (error) {
      if (__DEV__) console.warn('[SessionTracking] Failed to reset daily count:', error);
    }
  }

  /**
   * Increment daily session count
   * Call this after each completed FOCUS session
   */
  async incrementDailySession() {
    try {
      // First ensure it's still the same day
      await this.resetDailyCountIfNeeded();

      // Get current count
      const currentCount = await this.getDailySessionCount();
      const newCount = currentCount + 1;

      // Update count
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_SESSIONS, newCount.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SESSION_DATE, new Date().toDateString());

      if (__DEV__) {
        console.log(`[SessionTracking] Daily sessions: ${newCount}`);
      }

      return newCount;
    } catch (error) {
      if (__DEV__) console.warn('[SessionTracking] Failed to increment session:', error);
      return 0;
    }
  }

  /**
   * Get current daily session count
   * @returns {Promise<number>}
   */
  async getDailySessionCount() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_SESSIONS);
      return parseInt(stored || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Check if user is a legacy user (unlimited sessions)
   * @returns {Promise<boolean>}
   */
  async isLegacyUser() {
    try {
      const legacy = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_USER);
      return legacy === 'true';
    } catch {
      // Fail safe: treat as legacy on error
      return true;
    }
  }

  /**
   * Get days since app was first installed
   * @returns {Promise<number>}
   */
  async getDaysSinceInstall() {
    try {
      const installDate = await AsyncStorage.getItem(STORAGE_KEYS.INSTALL_DATE);
      if (!installDate) {
        return 0;
      }

      const installed = parseInt(installDate, 10);
      const now = Date.now();
      const diffMs = now - installed;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch {
      return 0;
    }
  }

  /**
   * Check if user is in grace period (first 7 days)
   * @returns {Promise<boolean>}
   */
  async isInGracePeriod() {
    try {
      const daysSinceInstall = await this.getDaysSinceInstall();
      return daysSinceInstall < 7;
    } catch {
      // Fail safe: consider in grace period on error
      return true;
    }
  }

  /**
   * Get comprehensive session tracking status
   * Useful for debugging and analytics
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const dailySessions = await this.getDailySessionCount();
    const isLegacy = await this.isLegacyUser();
    const daysSinceInstall = await this.getDaysSinceInstall();
    const inGracePeriod = await this.isInGracePeriod();
    const installDate = await AsyncStorage.getItem(STORAGE_KEYS.INSTALL_DATE);

    return {
      dailySessions,
      isLegacyUser: isLegacy,
      daysSinceInstall,
      inGracePeriod,
      installDate: installDate ? new Date(parseInt(installDate, 10)) : null,
    };
  }

  /**
   * Development helper - reset all tracking
   * Only works in __DEV__ mode
   */
  async resetForTesting() {
    if (__DEV__) {
      await AsyncStorage.removeItem(STORAGE_KEYS.DAILY_SESSIONS);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SESSION_DATE);
      await AsyncStorage.removeItem(STORAGE_KEYS.INSTALL_DATE);
      await AsyncStorage.removeItem(STORAGE_KEYS.LEGACY_USER);
      await AsyncStorage.removeItem(STORAGE_KEYS.FIRST_V102_LAUNCH);
      console.log('[SessionTracking] Reset for testing');
    }
  }

  /**
   * Development helper - simulate legacy user
   */
  async simulateLegacyUser() {
    if (__DEV__) {
      await AsyncStorage.setItem(STORAGE_KEYS.LEGACY_USER, 'true');
      await AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify({
        phase: 'focus',
        phaseEndAt: Date.now() + 1000000,
      }));
      console.log('[SessionTracking] Simulated legacy user');
    }
  }

  /**
   * Development helper - simulate new user with X days since install
   */
  async simulateNewUser(daysAgo = 0) {
    if (__DEV__) {
      const installDate = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
      await AsyncStorage.setItem(STORAGE_KEYS.INSTALL_DATE, installDate.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.LEGACY_USER, 'false');
      await AsyncStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
      console.log(`[SessionTracking] Simulated new user (${daysAgo} days ago)`);
    }
  }
}

export default new SessionTrackingService();
