// Minimal Jest setup for logic testing
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock AsyncStorage for timer persistence tests
global.AsyncStorage = {
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
};