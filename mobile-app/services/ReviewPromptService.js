// mobile-app/services/ReviewPromptService.js
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnalyticsService from './AnalyticsService';
import { STORAGE_KEYS, MONETIZATION_CONFIG } from '../config/monetization';

/**
 * ReviewPromptService
 *
 * Manages app review prompts using Apple/Google's native StoreReview API
 * Respects platform limits: 3 prompts per 365 days (Apple enforced)
 *
 * Triggers:
 * 1. After 10 completed focus sessions (40-50% of users)
 * 2. 7-day anniversary with 5+ sessions (20-30% of users)
 * 3. Productive day: 8 sessions in one day (10-15% of users)
 */
class ReviewPromptService {
  /**
   * Request a review prompt from the user
   * @param {string} trigger - Trigger source: '10_sessions' | '7_day_anniversary' | 'productive_day'
   * @returns {Promise<boolean>} - True if prompt was attempted, false if skipped
   */
  async requestReview(trigger) {
    try {
      // Check if StoreReview API is available
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) {
        if (__DEV__) console.log('[Review] StoreReview API not available on this platform');
        return false;
      }

      // Check if we should prompt (respects cooldown and quota)
      const shouldPrompt = await this.shouldPromptReview();
      if (!shouldPrompt) {
        if (__DEV__) console.log('[Review] Should not prompt (cooldown or quota)');
        return false;
      }

      // Get analytics data
      const totalSessions = await this.getTotalSessions();
      const daysSinceInstall = await this.getDaysSinceInstall();

      // Track analytics BEFORE prompting (prompt may not show)
      await AnalyticsService.logEvent('review_prompt_attempted', {
        trigger,
        total_sessions: totalSessions,
        days_since_install: daysSinceInstall,
      });

      // Request review (native dialog)
      // Note: This may or may not show depending on Apple/Google's internal logic
      await StoreReview.requestReview();

      // Record that we attempted a prompt
      await this.recordPromptShown(trigger);

      if (__DEV__) console.log(`[Review] Review prompt requested (${trigger})`);
      return true;
    } catch (error) {
      if (__DEV__) console.warn('[Review] Error requesting review:', error);
      return false;
    }
  }

  /**
   * Check if we should show a review prompt
   * Enforces cooldown periods and quota limits
   * @returns {Promise<boolean>}
   */
  async shouldPromptReview() {
    try {
      // Check if we've hit our local quota (3 prompts)
      const promptCount = await this.getPromptCount();
      if (promptCount >= 3) {
        // Used all 3 prompts - could reset after 365 days if you want
        return false;
      }

      // Check cooldown between prompts
      const lastPromptDate = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_LAST_PROMPT_DATE);
      if (lastPromptDate) {
        const daysSincePrompt = this.getDaysSince(parseInt(lastPromptDate, 10));
        if (daysSincePrompt < MONETIZATION_CONFIG.REVIEW_PROMPT_COOLDOWN_DAYS) {
          // Wait cooldown period between prompts
          return false;
        }
      }

      // Check if already prompted in this version
      const versionPrompted = await AsyncStorage.getItem(STORAGE_KEYS.VERSION_PROMPTED);
      const currentVersion = await this.getAppVersion();
      if (versionPrompted === currentVersion) {
        // Only prompt once per version
        return false;
      }

      return true;
    } catch (error) {
      if (__DEV__) console.warn('[Review] Error checking eligibility:', error);
      return false;
    }
  }

  /**
   * Record that a prompt was shown
   * @param {string} trigger
   */
  async recordPromptShown(trigger) {
    try {
      const promptCount = await this.getPromptCount();
      const newCount = promptCount + 1;

      await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_PROMPT_COUNT, newCount.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_LAST_PROMPT_DATE, Date.now().toString());

      // Record version
      const currentVersion = await this.getAppVersion();
      await AsyncStorage.setItem(STORAGE_KEYS.VERSION_PROMPTED, currentVersion);

      await AnalyticsService.logEvent('review_prompt_shown', {
        trigger,
        prompt_number: newCount,
      });

      if (__DEV__) console.log(`[Review] Prompt ${newCount}/3 shown (${trigger})`);
    } catch (error) {
      if (__DEV__) console.warn('[Review] Error recording prompt:', error);
    }
  }

  /**
   * Increment total session count and check triggers
   * Call this after each FOCUS session completes
   * @returns {Promise<number>} - New total session count
   */
  async incrementTotalSessions() {
    try {
      const current = await this.getTotalSessions();
      const newCount = current + 1;

      await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_TOTAL_SESSIONS, newCount.toString());

      // Check if any triggers should fire
      await this.checkTriggers(newCount);

      if (__DEV__) console.log(`[Review] Total sessions: ${newCount}`);
      return newCount;
    } catch (error) {
      if (__DEV__) console.warn('[Review] Error incrementing sessions:', error);
      return 0;
    }
  }

  /**
   * Check all trigger conditions
   * @param {number} totalSessions
   */
  async checkTriggers(totalSessions) {
    // Trigger #1: After milestone completed focus sessions
    if (totalSessions === MONETIZATION_CONFIG.REVIEW_PROMPT_SESSIONS_MILESTONE) {
      await this.requestReview('10_sessions');
      return;
    }

    // Trigger #2: Anniversary with 5+ sessions
    const daysSinceInstall = await this.getDaysSinceInstall();
    if (daysSinceInstall === MONETIZATION_CONFIG.REVIEW_PROMPT_ANNIVERSARY_DAYS && totalSessions >= 5) {
      await this.requestReview('7_day_anniversary');
      return;
    }

    // Trigger #3: Productive day
    const sessionsToday = await this.getDailySessionCount();
    if (sessionsToday === MONETIZATION_CONFIG.REVIEW_PROMPT_PRODUCTIVE_DAY_SESSIONS) {
      await this.requestReview('productive_day');
      return;
    }

    // Could add more triggers:
    // - After 25 sessions (power user)
    // - After 50 sessions (super user)
    // - 30-day anniversary
  }

  /**
   * Get total completed focus sessions
   * @returns {Promise<number>}
   */
  async getTotalSessions() {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_TOTAL_SESSIONS);
      return parseInt(count || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Get daily session count (resets at midnight)
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
   * Get number of review prompts shown
   * @returns {Promise<number>}
   */
  async getPromptCount() {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_PROMPT_COUNT);
      return parseInt(count || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Get or create install date
   * @returns {Promise<number>} - Timestamp in ms
   */
  async getInstallDate() {
    try {
      let installDate = await AsyncStorage.getItem(STORAGE_KEYS.INSTALL_DATE);
      if (!installDate) {
        // First time - set install date
        installDate = Date.now().toString();
        await AsyncStorage.setItem(STORAGE_KEYS.INSTALL_DATE, installDate);

        if (__DEV__) console.log('[Review] Install date set:', new Date(parseInt(installDate, 10)));
      }
      return parseInt(installDate, 10);
    } catch {
      return Date.now();
    }
  }

  /**
   * Get days since app was installed
   * @returns {Promise<number>}
   */
  async getDaysSinceInstall() {
    const installDate = await this.getInstallDate();
    return this.getDaysSince(installDate);
  }

  /**
   * Calculate days since a timestamp
   * @param {number} timestamp - Timestamp in ms
   * @returns {number} - Days elapsed
   */
  getDaysSince(timestamp) {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get app version from Constants
   * @returns {Promise<string>}
   */
  async getAppVersion() {
    try {
      const Constants = require('expo-constants').default;
      return Constants.expoConfig?.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  /**
   * Development helper - reset all review tracking
   * Only works in __DEV__ mode
   */
  async resetForTesting() {
    if (__DEV__) {
      await AsyncStorage.removeItem(STORAGE_KEYS.REVIEW_PROMPT_COUNT);
      await AsyncStorage.removeItem(STORAGE_KEYS.REVIEW_LAST_PROMPT_DATE);
      await AsyncStorage.removeItem(STORAGE_KEYS.REVIEW_TOTAL_SESSIONS);
      await AsyncStorage.removeItem(STORAGE_KEYS.INSTALL_DATE);
      await AsyncStorage.removeItem(STORAGE_KEYS.VERSION_PROMPTED);
      console.log('[Review] All review tracking reset for testing');
    }
  }

  /**
   * Get current status (for debugging)
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const promptCount = await this.getPromptCount();
    const totalSessions = await this.getTotalSessions();
    const daysSinceInstall = await this.getDaysSinceInstall();
    const lastPromptDate = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_LAST_PROMPT_DATE);
    const shouldPrompt = await this.shouldPromptReview();

    return {
      promptCount,
      totalSessions,
      daysSinceInstall,
      lastPromptDate: lastPromptDate ? new Date(parseInt(lastPromptDate, 10)) : null,
      shouldPrompt,
    };
  }
}

export default new ReviewPromptService();
