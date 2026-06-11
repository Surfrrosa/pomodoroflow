import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn = Constants.expoConfig?.extra?.sentryDsn ?? '';
let initialized = false;

export function init() {
  if (__DEV__ || !dsn) return;
  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0,
  });
  initialized = true;
}

export function captureException(error, context) {
  if (__DEV__) {
    console.warn('[ErrorReporter] captureException:', error, context);
    return;
  }
  if (!initialized) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function addBreadcrumb(message, category, data) {
  if (__DEV__) {
    console.log(`[ErrorReporter] breadcrumb [${category}] ${message}`, data ?? '');
    return;
  }
  if (!initialized) return;
  Sentry.addBreadcrumb({ message, category, level: 'info', data });
}

export const wrap = Sentry.wrap;
