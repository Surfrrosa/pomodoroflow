/**
 * Monetization Configuration
 * Tip Jar only - app is completely free forever
 */

export const MONETIZATION_CONFIG = {
  // Product identifiers - Tip Jar (one-time purchases)
  TIP_JAR_COFFEE_IOS: 'com.surfrrosa.pomodoroflow.tip_coffee',
  TIP_JAR_COFFEE_ANDROID: 'tip_coffee',
  TIP_JAR_LUNCH_IOS: 'com.surfrrosa.pomodoroflow.tip_lunch',
  TIP_JAR_LUNCH_ANDROID: 'tip_lunch',
  TIP_JAR_SUPPORTER_IOS: 'com.surfrrosa.pomodoroflow.tip_supporter',
  TIP_JAR_SUPPORTER_ANDROID: 'tip_supporter',

  // Tip amounts
  TIP_COFFEE_AMOUNT: 1.99,
  TIP_LUNCH_AMOUNT: 4.99,
  TIP_SUPPORTER_AMOUNT: 9.99,

  // Review prompts
  REVIEW_PROMPT_SESSIONS_MILESTONE: 10,
  REVIEW_PROMPT_ANNIVERSARY_DAYS: 7,
  REVIEW_PROMPT_PRODUCTIVE_DAY_SESSIONS: 8,
  REVIEW_PROMPT_COOLDOWN_DAYS: 90, // 3 months between prompts
} as const;

/**
 * Storage Keys
 * Centralized to avoid duplication and typos
 */
export const STORAGE_KEYS = {
  // App state
  TIMER_STATE: 'pomodoroflow_state',
  INSTALL_DATE: '@pomodoroflow:install_date',

  // Review prompts
  REVIEW_TOTAL_SESSIONS: '@pomodoroflow:review_total_sessions',
  REVIEW_LAST_PROMPT_DATE: '@pomodoroflow:review_last_prompt_date',
  REVIEW_PROMPT_COUNT: '@pomodoroflow:review_prompt_count',
  VERSION_PROMPTED: '@pomodoroflow:version_prompted',
  DAILY_SESSIONS: '@pomodoroflow:daily_sessions',
} as const;

/**
 * Feature flags
 */
export const FEATURE_FLAGS = {
  ENABLE_TIP_JAR: true,
  ENABLE_REVIEW_PROMPTS: true,
} as const;
