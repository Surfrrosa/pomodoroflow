/**
 * Monetization Configuration
 * Central source of truth for all freemium and pricing settings
 */

export const MONETIZATION_CONFIG = {
  // Freemium limits
  FREE_TIER_DAILY_LIMIT: 8,
  GRACE_PERIOD_DAYS: 7,

  // Pricing
  PREMIUM_PRICE_USD: 4.99,
  PREMIUM_PRICE_DISPLAY: '$4.99',

  // Product identifiers - Premium
  IOS_PRODUCT_ID: 'com.surfrrosa.pomodoroflow.premium',
  ANDROID_PRODUCT_ID: 'premium_unlock',
  REVENUECAT_ENTITLEMENT_ID: 'pro', // RevenueCat uses 'pro' by default

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

  // RevenueCat API Keys
  REVENUECAT_IOS_KEY: 'appl_HDKjhBJNxYJBEOQyezWNHJAdolf',
  REVENUECAT_ANDROID_KEY: 'goog_YhtLDFOrvFhtHxYMHVcSjFbZkXr',

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
  // Session tracking
  DAILY_SESSIONS: '@pomodoroflow:daily_sessions',
  LAST_SESSION_DATE: '@pomodoroflow:last_session_date',
  INSTALL_DATE: '@pomodoroflow:install_date',
  LEGACY_USER: '@pomodoroflow:legacy_user',
  FIRST_V102_LAUNCH: '@pomodoroflow:first_v102_launch',

  // Premium status
  IS_PREMIUM: '@pomodoroflow:is_premium',

  // User identification
  USER_ID: '@pomodoroflow:user_id',

  // App state
  TIMER_STATE: 'pomodoroflow_state',

  // Review prompts
  REVIEW_TOTAL_SESSIONS: '@pomodoroflow:review_total_sessions',
  REVIEW_LAST_PROMPT_DATE: '@pomodoroflow:review_last_prompt_date',
  REVIEW_PROMPT_COUNT: '@pomodoroflow:review_prompt_count',
  VERSION_PROMPTED: '@pomodoroflow:version_prompted',
} as const;

/**
 * Feature flags for gradual rollout or A/B testing
 */
export const FEATURE_FLAGS = {
  ENABLE_PURCHASE_FLOW: true,
  ENABLE_REVIEW_PROMPTS: true,
  ENABLE_SESSION_LIMITS: true,
  ENABLE_GRACE_PERIOD: true,
} as const;
