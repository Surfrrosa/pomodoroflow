import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import App from '../App';

const mockDateNow = jest.spyOn(Date, 'now');

describe('PomodoroFlow App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    mockDateNow.mockReturnValue(1000000); // Fixed timestamp
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  test('renders initial state correctly', () => {
    const { getByText } = render(<App />);
    
    expect(getByText('FOCUS')).toBeTruthy();
    expect(getByText('25:00')).toBeTruthy();
    expect(getByText('Start')).toBeTruthy();
    expect(getByText('Dev Fast Mode')).toBeTruthy();
  });

  test('starts focus phase when Start button is pressed', async () => {
    const { getByText } = render(<App />);
    
    await act(async () => {
      fireEvent.press(getByText('Start'));
    });

    await waitFor(() => {
      expect(getByText('Pause')).toBeTruthy();
      expect(getByText('00:25')).toBeTruthy(); // Dev fast mode
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Break time!',
        body: 'Time for a break',
        sound: true,
      },
      trigger: { type: 'date', date: expect.any(Date) },
    });
  });

  test('pauses and resumes timer correctly', async () => {
    const { getByText } = render(<App />);
    
    await act(async () => {
      fireEvent.press(getByText('Start'));
    });

    await act(async () => {
      fireEvent.press(getByText('Pause'));
    });

    await waitFor(() => {
      expect(getByText('Resume')).toBeTruthy();
    });

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByText('Resume'));
    });

    await waitFor(() => {
      expect(getByText('Pause')).toBeTruthy();
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });

  test('stops timer and resets to initial state', async () => {
    const { getByText } = render(<App />);
    
    await act(async () => {
      fireEvent.press(getByText('Start'));
    });

    await act(async () => {
      fireEvent.press(getByText('Stop'));
    });

    await waitFor(() => {
      expect(getByText('Start')).toBeTruthy();
      expect(getByText('FOCUS')).toBeTruthy();
      expect(getByText('25:00')).toBeTruthy();
    });

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalled();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('pomodoroflow_state');
  });

  test('transitions from focus to break phase automatically', async () => {
    const { getByText } = render(<App />);
    
    await act(async () => {
      fireEvent.press(getByText('Start'));
    });

    mockDateNow.mockReturnValue(1000000 + 25000);

    await act(async () => {
      jest.advanceTimersByTime(200); // Trigger interval
    });

    await waitFor(() => {
      expect(getByText('BREAK')).toBeTruthy();
      expect(getByText('00:05')).toBeTruthy(); // 5 second break in dev mode
    });
  });

  test('persists state to AsyncStorage', async () => {
    const { getByText } = render(<App />);
    
    await act(async () => {
      fireEvent.press(getByText('Start'));
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pomodoroflow_state',
        expect.stringContaining('"phase":"focus"')
      );
    });
  });

  test('restores state from AsyncStorage on app start', async () => {
    const storedState = {
      phase: 'focus',
      phaseStartAt: 1000000,
      phaseEndAt: 1000000 + 10000, // 10 seconds remaining
    };
    
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(storedState));
    mockDateNow.mockReturnValue(1000000 + 5000); // 5 seconds elapsed

    const { getByText } = render(<App />);

    await waitFor(() => {
      expect(getByText('FOCUS')).toBeTruthy();
      expect(getByText('00:05')).toBeTruthy(); // 5 seconds remaining
      expect(getByText('Pause')).toBeTruthy(); // Should be running
    });
  });

  test('toggles dev fast mode correctly', async () => {
    const { getByText, getByRole } = render(<App />);
    
    const toggle = getByRole('switch');
    await act(async () => {
      fireEvent(toggle, 'valueChange', false);
    });

    await act(async () => {
      fireEvent.press(getByText('Start'));
    });

    await waitFor(() => {
      expect(getByText('25:00')).toBeTruthy(); // Full duration
    });
  });
});
