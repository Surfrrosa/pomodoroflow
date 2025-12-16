// mobile-app/services/AnalyticsService.js

/**
 * AnalyticsService - Stub Implementation
 *
 * NOTE: Firebase Analytics has been temporarily removed from v1.0.3
 * This stub ensures the app doesn't crash when analytics events are logged.
 * All methods are no-ops that only log to console in development.
 *
 * TODO: Implement real Firebase Analytics in v1.0.4
 */
class AnalyticsService {
  /**
   * Log a custom event
   * @param {string} eventName - Name of the event
   * @param {object} params - Event parameters (optional)
   */
  async logEvent(eventName, params = {}) {
    if (__DEV__) {
      console.log(`[Analytics Stub] Event: ${eventName}`, params);
    }
  }

  async logSessionStart(phase, duration) {
    await this.logEvent('session_start', {
      session_type: phase,
      duration_seconds: duration,
    });
  }

  async logSessionComplete(phase, duration) {
    await this.logEvent('session_complete', {
      session_type: phase,
      duration_seconds: duration,
    });
  }

  async logSessionPause(phase, timeRemaining) {
    await this.logEvent('session_pause', {
      session_type: phase,
      time_remaining_seconds: timeRemaining,
    });
  }

  async logSessionStop(phase, timeRemaining) {
    await this.logEvent('session_stop', {
      session_type: phase,
      time_remaining_seconds: timeRemaining,
    });
  }

  async logSessionResume(phase, timeRemaining) {
    await this.logEvent('session_resume', {
      session_type: phase,
      time_remaining_seconds: timeRemaining,
    });
  }

  async setUserProperties(properties) {
    if (__DEV__) {
      console.log('[Analytics Stub] User properties:', properties);
    }
  }

  async logScreenView(screenName) {
    if (__DEV__) {
      console.log('[Analytics Stub] Screen view:', screenName);
    }
  }

  async setAnalyticsEnabled(enabled) {
    if (__DEV__) {
      console.log(`[Analytics Stub] Analytics ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  async logUpgradeModalShown(trigger, sessionCount, daysSinceInstall) {
    await this.logEvent('upgrade_modal_shown', {
      trigger,
      session_count: sessionCount,
      days_since_install: daysSinceInstall,
    });
  }

  async logUpgradeModalDismissed(trigger, timeSpent) {
    await this.logEvent('upgrade_modal_dismissed', {
      trigger,
      time_spent_seconds: timeSpent,
    });
  }

  async logPurchaseAttempt(productId, price) {
    await this.logEvent('purchase_attempt', {
      product_id: productId,
      price: price,
    });
  }

  async logPurchaseSuccess(productId, price, sessionCount) {
    await this.logEvent('purchase_success', {
      product_id: productId,
      price: price,
      session_count_at_purchase: sessionCount,
      value: 4.99,
      currency: 'USD',
    });
  }

  async logPurchaseFailed(productId, reason) {
    await this.logEvent('purchase_failed', {
      product_id: productId,
      failure_reason: reason,
    });
  }

  async logRestorePurchasesAttempt() {
    await this.logEvent('restore_purchases_attempt');
  }

  async logRestorePurchasesSuccess() {
    await this.logEvent('restore_purchases_success');
  }

  async logSessionLimitWarning(sessionsRemaining) {
    await this.logEvent('session_limit_warning', {
      sessions_remaining: sessionsRemaining,
    });
  }

  async logSessionLimitReached(isPremium) {
    await this.logEvent('session_limit_reached', {
      is_premium: isPremium,
    });
  }

  // Tip Jar events (from v1.0.3)
  async logTipJarShown(trigger) {
    await this.logEvent('tip_jar_shown', { trigger });
  }

  async logTipJarDismissed(trigger) {
    await this.logEvent('tip_jar_dismissed', { trigger });
  }

  async logTipJarDonation(amount, trigger) {
    await this.logEvent('tip_jar_donation', {
      amount,
      trigger,
      value: amount,
      currency: 'USD',
    });
  }

  // Review prompt events
  async logReviewPromptAttempted(trigger) {
    await this.logEvent('review_prompt_attempted', { trigger });
  }

  async logReviewPromptShown(trigger) {
    await this.logEvent('review_prompt_shown', { trigger });
  }
}

export default new AnalyticsService();
