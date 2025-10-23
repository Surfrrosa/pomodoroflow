// mobile-app/services/AnalyticsService.js
import analytics from '@react-native-firebase/analytics';

class AnalyticsService {
  /**
   * Log a custom event to Google Analytics
   * @param {string} eventName - Name of the event (e.g., 'session_completed', 'session_started')
   * @param {object} params - Event parameters (optional)
   */
  async logEvent(eventName, params = {}) {
    try {
      await analytics().logEvent(eventName, params);
      if (__DEV__) {
        console.log(`[Analytics] Event logged: ${eventName}`, params);
      }
    } catch (error) {
      if (__DEV__) {
        console.error(`[Analytics] Failed to log event ${eventName}:`, error);
      }
    }
  }

  /**
   * Log when a pomodoro session starts
   * @param {string} phase - 'focus' or 'break'
   * @param {number} duration - Duration in seconds
   */
  async logSessionStart(phase, duration) {
    await this.logEvent('session_start', {
      session_type: phase,
      duration_seconds: duration,
    });
  }

  /**
   * Log when a pomodoro session completes
   * @param {string} phase - 'focus' or 'break'
   * @param {number} duration - Duration in seconds
   */
  async logSessionComplete(phase, duration) {
    await this.logEvent('session_complete', {
      session_type: phase,
      duration_seconds: duration,
    });
  }

  /**
   * Log when a session is paused
   * @param {string} phase - 'focus' or 'break'
   * @param {number} timeRemaining - Time remaining in seconds
   */
  async logSessionPause(phase, timeRemaining) {
    await this.logEvent('session_pause', {
      session_type: phase,
      time_remaining_seconds: timeRemaining,
    });
  }

  /**
   * Log when a session is stopped/cancelled
   * @param {string} phase - 'focus' or 'break'
   * @param {number} timeRemaining - Time remaining in seconds
   */
  async logSessionStop(phase, timeRemaining) {
    await this.logEvent('session_stop', {
      session_type: phase,
      time_remaining_seconds: timeRemaining,
    });
  }

  /**
   * Log when a session is resumed
   * @param {string} phase - 'focus' or 'break'
   * @param {number} timeRemaining - Time remaining in seconds
   */
  async logSessionResume(phase, timeRemaining) {
    await this.logEvent('session_resume', {
      session_type: phase,
      time_remaining_seconds: timeRemaining,
    });
  }

  /**
   * Set user properties
   * @param {object} properties - User properties to set
   */
  async setUserProperties(properties) {
    try {
      for (const [key, value] of Object.entries(properties)) {
        await analytics().setUserProperty(key, value);
      }
      if (__DEV__) {
        console.log('[Analytics] User properties set:', properties);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Analytics] Failed to set user properties:', error);
      }
    }
  }

  /**
   * Log screen view
   * @param {string} screenName - Name of the screen
   */
  async logScreenView(screenName) {
    await this.logEvent('screen_view', {
      screen_name: screenName,
    });
  }

  /**
   * Enable/disable analytics collection
   * @param {boolean} enabled
   */
  async setAnalyticsEnabled(enabled) {
    try {
      await analytics().setAnalyticsCollectionEnabled(enabled);
      if (__DEV__) {
        console.log(`[Analytics] Analytics collection ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Analytics] Failed to set analytics collection:', error);
      }
    }
  }
}

export default new AnalyticsService();
