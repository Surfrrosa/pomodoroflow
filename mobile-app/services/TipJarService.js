// mobile-app/services/TipJarService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnalyticsService from './AnalyticsService';

/**
 * TipJarService
 *
 * Manages tip jar prompts with empathetic, non-intrusive timing
 * Respects user attention and never stacks with review prompts
 *
 * Triggers:
 * 1. After 25 completed sessions ("Power User Gratitude")
 * 2. 30-day anniversary with 15+ sessions ("Productive Month")
 * 3. Always visible in Settings (passive, non-modal)
 */
class TipJarService {
  // Storage keys
  STORAGE_KEYS = {
    TIP_JAR_SHOWN_COUNT: '@pomodoroflow:tip_jar_shown_count',
    TIP_JAR_LAST_SHOWN_DATE: '@pomodoroflow:tip_jar_last_shown_date',
    TIP_JAR_DISMISSED_COUNT: '@pomodoroflow:tip_jar_dismissed_count',
    TIP_JAR_TRIGGERS_FIRED: '@pomodoroflow:tip_jar_triggers_fired',
    USER_HAS_DONATED: '@pomodoroflow:user_has_donated',
    LAST_REVIEW_PROMPT_DATE: '@pomodoroflow:review_last_prompt_date', // From ReviewPromptService
  };

  // Configuration
  CONFIG = {
    MAX_MODAL_SHOWS: 3, // Never show modal more than 3 times total
    MAX_DISMISSALS: 2, // After 2 dismissals, never show modal again
    COOLDOWN_DAYS: 14, // Wait 14 days between tip jar prompts
    REVIEW_COOLDOWN_DAYS: 7, // Wait 7 days after review prompt
    POWER_USER_SESSIONS: 25, // "Power User Gratitude" trigger
    ANNIVERSARY_DAYS: 30, // "Productive Month" trigger
    ANNIVERSARY_MIN_SESSIONS: 15, // Minimum sessions for anniversary trigger
  };

  /**
   * Check if we should show a tip jar prompt for the given trigger
   * @param {string} trigger - 'power_user' | 'anniversary'
   * @returns {Promise<boolean>}
   */
  async shouldShowTipJar(trigger) {
    try {
      // Global limits
      const shownCount = await this.getShownCount();
      if (shownCount >= this.CONFIG.MAX_MODAL_SHOWS) {
        if (__DEV__) console.log('[TipJar] Hit max modal shows (3)');
        return false;
      }

      // Check if user has dismissed too many times
      const dismissedCount = await this.getDismissedCount();
      if (dismissedCount >= this.CONFIG.MAX_DISMISSALS) {
        if (__DEV__) console.log('[TipJar] User dismissed 2+ times - no more modals');
        return false;
      }

      // Check if user has already donated
      const hasDonated = await this.hasUserDonated();
      if (hasDonated) {
        if (__DEV__) console.log('[TipJar] User already donated');
        return false;
      }

      // Check cooldown since last tip jar
      const daysSinceLastTipJar = await this.getDaysSinceLastShown();
      if (daysSinceLastTipJar !== null && daysSinceLastTipJar < this.CONFIG.COOLDOWN_DAYS) {
        if (__DEV__) console.log(`[TipJar] Cooldown active: ${daysSinceLastTipJar}/${this.CONFIG.COOLDOWN_DAYS} days`);
        return false;
      }

      // Check if review was shown recently
      const daysSinceReview = await this.getDaysSinceLastReview();
      if (daysSinceReview !== null && daysSinceReview < this.CONFIG.REVIEW_COOLDOWN_DAYS) {
        if (__DEV__) console.log(`[TipJar] Review shown ${daysSinceReview} days ago - waiting`);
        return false;
      }

      // Check if this trigger already fired
      const firedTriggers = await this.getFiredTriggers();
      if (firedTriggers.includes(trigger)) {
        if (__DEV__) console.log(`[TipJar] Trigger "${trigger}" already fired`);
        return false;
      }

      if (__DEV__) console.log(`[TipJar] Should show for trigger: ${trigger}`);
      return true;
    } catch (error) {
      if (__DEV__) console.warn('[TipJar] Error checking eligibility:', error);
      return false;
    }
  }

  /**
   * Show tip jar modal
   * Returns a promise that resolves when user makes a choice
   * @param {string} trigger - Trigger source
   * @returns {Promise<{ action: 'donated' | 'dismissed', amount?: number }>}
   */
  async showTipJarModal(trigger) {
    try {
      await AnalyticsService.logEvent('tip_jar_shown', { trigger });

      // Record that we showed it
      await this.recordShown(trigger);

      if (__DEV__) console.log(`[TipJar] Showing modal for trigger: ${trigger}`);

      // This will be called from UI component - return trigger info
      return { trigger };
    } catch (error) {
      if (__DEV__) console.warn('[TipJar] Error showing modal:', error);
      throw error;
    }
  }

  /**
   * Record that user dismissed the tip jar
   * @param {string} trigger
   */
  async recordDismissed(trigger) {
    try {
      const count = await this.getDismissedCount();
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.TIP_JAR_DISMISSED_COUNT,
        String(count + 1)
      );

      await AnalyticsService.logEvent('tip_jar_dismissed', { trigger });

      if (__DEV__) console.log(`[TipJar] Dismissed (${count + 1} total)`);
    } catch (error) {
      if (__DEV__) console.warn('[TipJar] Error recording dismissal:', error);
    }
  }

  /**
   * Record that user donated
   * @param {number} amount - Dollar amount (1.99, 4.99, or 9.99)
   * @param {string} trigger - What triggered the tip jar
   */
  async recordDonation(amount, trigger) {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER_HAS_DONATED, 'true');

      await AnalyticsService.logEvent('tip_jar_donation', {
        amount,
        trigger,
        value: amount,
        currency: 'USD',
      });

      if (__DEV__) console.log(`[TipJar] Donation recorded: $${amount}`);
    } catch (error) {
      if (__DEV__) console.warn('[TipJar] Error recording donation:', error);
    }
  }

  /**
   * Record that tip jar was shown
   * @param {string} trigger
   */
  async recordShown(trigger) {
    try {
      // Increment shown count
      const count = await this.getShownCount();
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.TIP_JAR_SHOWN_COUNT,
        String(count + 1)
      );

      // Update last shown date
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.TIP_JAR_LAST_SHOWN_DATE,
        String(Date.now())
      );

      // Mark trigger as fired
      const firedTriggers = await this.getFiredTriggers();
      firedTriggers.push(trigger);
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.TIP_JAR_TRIGGERS_FIRED,
        JSON.stringify(firedTriggers)
      );

      if (__DEV__) console.log(`[TipJar] Recorded shown: ${trigger} (${count + 1}/3)`);
    } catch (error) {
      if (__DEV__) console.warn('[TipJar] Error recording shown:', error);
    }
  }

  /**
   * Check triggers against current session count
   * Call this after each focus session completes
   * @param {number} totalSessions - Total completed sessions
   * @param {number} daysSinceInstall - Days since app installed
   */
  async checkTriggers(totalSessions, daysSinceInstall) {
    try {
      // Trigger #1: Power User (25 sessions)
      if (totalSessions === this.CONFIG.POWER_USER_SESSIONS) {
        const shouldShow = await this.shouldShowTipJar('power_user');
        if (shouldShow) {
          return { shouldShow: true, trigger: 'power_user' };
        }
      }

      // Trigger #2: 30-day anniversary with 15+ sessions
      if (
        daysSinceInstall === this.CONFIG.ANNIVERSARY_DAYS &&
        totalSessions >= this.CONFIG.ANNIVERSARY_MIN_SESSIONS
      ) {
        const shouldShow = await this.shouldShowTipJar('anniversary');
        if (shouldShow) {
          return { shouldShow: true, trigger: 'anniversary' };
        }
      }

      return { shouldShow: false };
    } catch (error) {
      if (__DEV__) console.warn('[TipJar] Error checking triggers:', error);
      return { shouldShow: false };
    }
  }

  // Helper methods

  async getShownCount() {
    try {
      const count = await AsyncStorage.getItem(this.STORAGE_KEYS.TIP_JAR_SHOWN_COUNT);
      return parseInt(count || '0', 10);
    } catch {
      return 0;
    }
  }

  async getDismissedCount() {
    try {
      const count = await AsyncStorage.getItem(this.STORAGE_KEYS.TIP_JAR_DISMISSED_COUNT);
      return parseInt(count || '0', 10);
    } catch {
      return 0;
    }
  }

  async hasUserDonated() {
    try {
      const donated = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_HAS_DONATED);
      return donated === 'true';
    } catch {
      return false;
    }
  }

  async getDaysSinceLastShown() {
    try {
      const lastShown = await AsyncStorage.getItem(this.STORAGE_KEYS.TIP_JAR_LAST_SHOWN_DATE);
      if (!lastShown) return null;

      const timestamp = parseInt(lastShown, 10);
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  }

  async getDaysSinceLastReview() {
    try {
      const lastReview = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_REVIEW_PROMPT_DATE);
      if (!lastReview) return null;

      const timestamp = parseInt(lastReview, 10);
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  }

  async getFiredTriggers() {
    try {
      const triggers = await AsyncStorage.getItem(this.STORAGE_KEYS.TIP_JAR_TRIGGERS_FIRED);
      return triggers ? JSON.parse(triggers) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get current status (for debugging)
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const shownCount = await this.getShownCount();
    const dismissedCount = await this.getDismissedCount();
    const hasDonated = await this.hasUserDonated();
    const daysSinceLastShown = await this.getDaysSinceLastShown();
    const daysSinceReview = await this.getDaysSinceLastReview();
    const firedTriggers = await this.getFiredTriggers();

    return {
      shownCount,
      dismissedCount,
      hasDonated,
      daysSinceLastShown,
      daysSinceReview,
      firedTriggers,
    };
  }

  /**
   * Development helper - reset all tip jar tracking
   * Only works in __DEV__ mode
   */
  async resetForTesting() {
    if (__DEV__) {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.TIP_JAR_SHOWN_COUNT);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.TIP_JAR_LAST_SHOWN_DATE);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.TIP_JAR_DISMISSED_COUNT);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.TIP_JAR_TRIGGERS_FIRED);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.USER_HAS_DONATED);
      console.log('[TipJar] All tracking reset for testing');
    }
  }
}

export default new TipJarService();
