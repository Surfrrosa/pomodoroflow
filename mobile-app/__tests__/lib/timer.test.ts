/**
 * Comprehensive timer logic tests
 * Testing the bulletproof PomodoroTimer class
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
// AppState is mocked in jest-setup.js

import { PomodoroTimer } from '../../lib/timer';
import type { TimerPhase, TimerState } from '../../types/timer';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-notifications');
jest.mock('expo-haptics');
// React Native is mocked in jest-setup.js

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

describe('PomodoroTimer', () => {
  let timer: PomodoroTimer;
  let mockEvents: {
    onTick: jest.Mock;
    onPhaseChange: jest.Mock;
    onSessionComplete: jest.Mock;
    onTimerComplete: jest.Mock;
    onStateChange: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockNotifications.scheduleNotificationAsync.mockResolvedValue('test-id');
    mockNotifications.cancelAllScheduledNotificationsAsync.mockResolvedValue();
    mockHaptics.impactAsync.mockResolvedValue();

    // Create event mocks
    mockEvents = {
      onTick: jest.fn(),
      onPhaseChange: jest.fn(),
      onSessionComplete: jest.fn(),
      onTimerComplete: jest.fn(),
      onStateChange: jest.fn(),
    };

    timer = new PomodoroTimer(mockEvents);
  });

  afterEach(() => {
    timer.destroy();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const timerData = timer.getTimerData();

      expect(timerData.phase).toBe('work');
      expect(timerData.state).toBe('idle');
      expect(timerData.timeRemaining).toBe(25 * 60); // 25 minutes
      expect(timerData.sessionCount).toBe(1);
      expect(timerData.isLongBreak).toBe(false);
    });

    it('should have correct default settings', () => {
      const settings = timer.getSettings();

      expect(settings.workDuration).toBe(25 * 60);
      expect(settings.shortBreakDuration).toBe(5 * 60);
      expect(settings.longBreakDuration).toBe(15 * 60);
      expect(settings.sessionsUntilLongBreak).toBe(4);
      expect(settings.notificationsEnabled).toBe(true);
    });
  });

  describe('Timer Controls', () => {
    it('should start timer correctly', async () => {
      await timer.start();

      const timerData = timer.getTimerData();
      expect(timerData.state).toBe('running');
      expect(mockEvents.onStateChange).toHaveBeenCalledWith('running');
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('should not start if already running', async () => {
      await timer.start();
      mockEvents.onStateChange.mockClear();

      await timer.start();

      expect(mockEvents.onStateChange).not.toHaveBeenCalled();
    });

    it('should pause timer correctly', async () => {
      await timer.start();
      await timer.pause();

      const timerData = timer.getTimerData();
      expect(timerData.state).toBe('paused');
      expect(mockEvents.onStateChange).toHaveBeenCalledWith('paused');
    });

    it('should resume from paused state', async () => {
      await timer.start();
      await timer.pause();
      await timer.resume();

      const timerData = timer.getTimerData();
      expect(timerData.state).toBe('running');
    });

    it('should reset timer to initial state', async () => {
      await timer.start();
      // Simulate some time passing
      jest.advanceTimersByTime(5000);

      await timer.reset();

      const timerData = timer.getTimerData();
      expect(timerData.state).toBe('idle');
      expect(timerData.phase).toBe('work');
      expect(timerData.timeRemaining).toBe(25 * 60);
      expect(timerData.sessionCount).toBe(1);
    });
  });

  describe('Timer Progression', () => {
    it('should tick down every second', async () => {
      await timer.start();

      // Advance by 3 seconds
      jest.advanceTimersByTime(3000);

      expect(mockEvents.onTick).toHaveBeenCalledTimes(3);

      const timerData = timer.getTimerData();
      expect(timerData.timeRemaining).toBe(25 * 60 - 3);
    });

    it('should complete work session and transition to break', async () => {
      // Set a very short work duration for testing
      await timer.updateSettings({ workDuration: 2 });

      // Reset to apply new settings
      await timer.reset();
      await timer.start();

      // Advance past work duration
      jest.advanceTimersByTime(3000);

      expect(mockEvents.onSessionComplete).toHaveBeenCalledWith(1);
      expect(mockEvents.onPhaseChange).toHaveBeenCalledWith('break');

      const timerData = timer.getTimerData();
      expect(timerData.phase).toBe('break');
      expect(timerData.state).toBe('completed');
    });

    it('should transition to long break after 4th session', async () => {
      // Fast-forward through sessions
      await timer.updateSettings({
        workDuration: 1,
        shortBreakDuration: 1,
      });

      // Complete 4 work sessions
      for (let i = 0; i < 4; i++) {
        await timer.reset();
        await timer.start();
        jest.advanceTimersByTime(2000); // Complete work session

        if (i < 3) {
          // Should be short break
          const timerData = timer.getTimerData();
          expect(timerData.phase).toBe('break');
          expect(timerData.isLongBreak).toBe(false);

          // Complete break
          jest.advanceTimersByTime(2000);
        }
      }

      // 4th session should trigger long break
      const timerData = timer.getTimerData();
      expect(timerData.phase).toBe('longBreak');
      expect(timerData.isLongBreak).toBe(true);
    });
  });

  describe('Background Handling', () => {
    it('should compensate for time spent in background', async () => {
      await timer.start();

      const initialTime = timer.getTimerData().timeRemaining;

      // Mock app going to background
      const AppState = require('react-native/Libraries/AppState/AppState');
      const appStateHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
      appStateHandler('background');

      // Simulate 30 seconds in background
      jest.advanceTimersByTime(30000);

      // Mock app coming to foreground
      appStateHandler('active');

      const timerData = timer.getTimerData();
      expect(timerData.timeRemaining).toBeLessThan(initialTime);
      expect(timerData.timeRemaining).toBe(initialTime - 30);
    });

    it('should complete session if enough time passed in background', async () => {
      await timer.updateSettings({ workDuration: 10 }); // 10 seconds
      await timer.reset();
      await timer.start();

      // Mock app going to background
      const AppState = require('react-native/Libraries/AppState/AppState');
      const appStateHandler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
      appStateHandler('background');

      // Simulate more time than work duration in background
      jest.advanceTimersByTime(15000);

      // Mock app coming to foreground
      appStateHandler('active');

      expect(mockEvents.onSessionComplete).toHaveBeenCalled();
      expect(mockEvents.onPhaseChange).toHaveBeenCalledWith('break');
    });
  });

  describe('Persistence', () => {
    it('should save timer data to AsyncStorage', async () => {
      await timer.start();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@pomodoroflow:timer_data',
        expect.stringContaining('"state":"running"')
      );
    });

    it('should load timer data from AsyncStorage', async () => {
      const mockTimerData = {
        phase: 'break',
        timeRemaining: 180,
        state: 'paused',
        sessionCount: 3,
        isLongBreak: false,
        lastUpdated: Date.now(),
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify(mockTimerData)
      );

      await timer.loadFromStorage();

      const timerData = timer.getTimerData();
      expect(timerData.phase).toBe('break');
      expect(timerData.timeRemaining).toBe(180);
      expect(timerData.sessionCount).toBe(3);
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw
      await expect(timer.start()).resolves.not.toThrow();
    });
  });

  describe('Notifications', () => {
    it('should schedule notification when starting timer', async () => {
      await timer.start();

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: 'Break Time!',
          body: expect.stringContaining('Great work!'),
        }),
        trigger: {
          seconds: 25 * 60,
        },
      });
    });

    it('should clear notifications on reset', async () => {
      await timer.reset();

      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('should respect notification settings', async () => {
      await timer.updateSettings({ notificationsEnabled: false });
      await timer.start();

      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('Settings Management', () => {
    it('should update settings correctly', async () => {
      const newSettings = {
        workDuration: 30 * 60,
        notificationsEnabled: false,
      };

      await timer.updateSettings(newSettings);

      const settings = timer.getSettings();
      expect(settings.workDuration).toBe(30 * 60);
      expect(settings.notificationsEnabled).toBe(false);
      expect(settings.shortBreakDuration).toBe(5 * 60); // Should preserve other settings
    });

    it('should persist settings to AsyncStorage', async () => {
      await timer.updateSettings({ workDuration: 30 * 60 });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@pomodoroflow:settings',
        expect.stringContaining('"workDuration":1800')
      );
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on destroy', () => {
      const AppState = require('react-native/Libraries/AppState/AppState');
      const removeListener = jest.fn();
      (AppState.addEventListener as jest.Mock).mockReturnValueOnce({
        remove: removeListener,
      });

      const newTimer = new PomodoroTimer();
      newTimer.destroy();

      expect(removeListener).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop cycles', async () => {
      for (let i = 0; i < 10; i++) {
        await timer.start();
        await timer.pause();
      }

      // Should be in a consistent state
      const timerData = timer.getTimerData();
      expect(['idle', 'paused', 'running']).toContain(timerData.state);
    });

    it('should handle timer completing at exactly 0 seconds', async () => {
      await timer.updateSettings({ workDuration: 1 });
      await timer.reset();
      await timer.start();

      jest.advanceTimersByTime(1000);

      expect(mockEvents.onSessionComplete).toHaveBeenCalled();
      expect(mockEvents.onTimerComplete).toHaveBeenCalled();
    });

    it('should not go below 0 time remaining', async () => {
      await timer.updateSettings({ workDuration: 5 });
      await timer.reset();
      await timer.start();

      // Advance more time than duration
      jest.advanceTimersByTime(10000);

      const timerData = timer.getTimerData();
      expect(timerData.timeRemaining).toBeGreaterThanOrEqual(0);
    });
  });
});