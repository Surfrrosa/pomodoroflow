/**
 * StreakService - Track consecutive days of focus sessions
 *
 * Streak logic:
 * - Increments when user completes at least 1 focus session in a day
 * - Continues if last session was within 48 hours (gives grace for timezone issues)
 * - Resets if more than 48 hours pass without a session
 * - Stores last session date and current streak count
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/monetization';

class StreakService {
  /**
   * Check and update streak after completing a focus session
   * @returns {Promise<{streak: number, isNewDay: boolean, message: string}>}
   */
  async recordFocusSession() {
    try {
      const now = new Date();
      const todayDate = this.getDateString(now);

      // Get current streak data
      const [streakCount, lastSessionDate, lifetimeSessions] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.STREAK_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK_LAST_SESSION_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_SESSIONS),
      ]);

      let currentStreak = parseInt(streakCount || '0', 10);
      let newLifetimeCount = parseInt(lifetimeSessions || '0', 10) + 1;
      let isNewDay = false;
      let message = '';

      // First session ever
      if (!lastSessionDate) {
        currentStreak = 1;
        isNewDay = true;
        message = 'Streak started! Come back tomorrow to keep it alive.';
      }
      // Same day - no streak change
      else if (lastSessionDate === todayDate) {
        // Streak stays same, just another session today
        message = '';
      }
      // Check if streak is still active
      else {
        const lastDate = new Date(lastSessionDate);
        const hoursSinceLastSession = (now - lastDate) / (1000 * 60 * 60);

        // Streak broken (more than 48 hours)
        if (hoursSinceLastSession > 48) {
          currentStreak = 1;
          isNewDay = true;
          message = 'Streak reset. Fresh start?';
        }
        // Streak continues
        else {
          currentStreak += 1;
          isNewDay = true;
          message = `Day ${currentStreak}! You're on fire.`;
        }
      }

      // Save updated data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.STREAK_COUNT, currentStreak.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.STREAK_LAST_SESSION_DATE, todayDate),
        AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_SESSIONS, newLifetimeCount.toString()),
      ]);

      if (__DEV__) {
        console.log('[Streak] Updated:', {
          streak: currentStreak,
          lifetimeSessions: newLifetimeCount,
          isNewDay,
          message,
        });
      }

      return {
        streak: currentStreak,
        lifetimeSessions: newLifetimeCount,
        isNewDay,
        message,
      };
    } catch (error) {
      console.error('[Streak] Error recording session:', error);
      return { streak: 0, lifetimeSessions: 0, isNewDay: false, message: '' };
    }
  }

  /**
   * Get current streak and lifetime sessions
   * @returns {Promise<{streak: number, lifetimeSessions: number}>}
   */
  async getStats() {
    try {
      const [streakCount, lifetimeSessions, lastSessionDate] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.STREAK_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK_LAST_SESSION_DATE),
      ]);

      let currentStreak = parseInt(streakCount || '0', 10);
      const lifetime = parseInt(lifetimeSessions || '0', 10);

      // Check if streak is still valid
      if (lastSessionDate && currentStreak > 0) {
        const now = new Date();
        const lastDate = new Date(lastSessionDate);
        const hoursSinceLastSession = (now - lastDate) / (1000 * 60 * 60);

        // Streak expired but not yet reset
        if (hoursSinceLastSession > 48) {
          currentStreak = 0;
        }
      }

      return {
        streak: currentStreak,
        lifetimeSessions: lifetime,
      };
    } catch (error) {
      console.error('[Streak] Error getting stats:', error);
      return { streak: 0, lifetimeSessions: 0 };
    }
  }

  /**
   * Get date string in YYYY-MM-DD format (local timezone)
   * @param {Date} date
   * @returns {string}
   */
  getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export default new StreakService();
