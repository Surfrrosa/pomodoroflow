// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock Expo modules
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('test-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1, NONE: 0 },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
  })),
}));

jest.mock('expo-iap', () => ({
  initConnection: jest.fn(() => Promise.resolve()),
  endConnection: jest.fn(() => Promise.resolve()),
  fetchProducts: jest.fn(() => Promise.resolve([])),
  requestPurchase: jest.fn(() => Promise.resolve(null)),
  finishTransaction: jest.fn(() => Promise.resolve()),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
  purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
  requestReview: jest.fn(() => Promise.resolve()),
}));

// Skip splash screen in tests; fire onComplete synchronously so the timer UI mounts
jest.mock('./components/SplashScreen', () => {
  const React = require('react');
  return {
    SplashScreen: ({ onComplete }) => {
      React.useEffect(() => { onComplete && onComplete(); }, [onComplete]);
      return null;
    },
  };
});

jest.useFakeTimers();
