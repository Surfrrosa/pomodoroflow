import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import App from '../App';

describe('PomodoroFlow App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  test('initial state is IDLE — Start button is visible', async () => {
    render(<App />);
    expect(await screen.findByLabelText('Start')).toBeTruthy();
  });

  test('pressing Start transitions to RUNNING — Pause button appears', async () => {
    render(<App />);
    const startBtn = await screen.findByLabelText('Start');
    await act(async () => {
      fireEvent.press(startBtn);
    });
    expect(await screen.findByLabelText('Pause')).toBeTruthy();
  });

  test('pressing Pause preserves phase — Resume button appears', async () => {
    render(<App />);
    const startBtn = await screen.findByLabelText('Start');
    await act(async () => {
      fireEvent.press(startBtn);
    });
    const pauseBtn = await screen.findByLabelText('Pause');
    await act(async () => {
      fireEvent.press(pauseBtn);
    });
    expect(await screen.findByLabelText('Resume')).toBeTruthy();
  });

  test('pressing Resume returns to RUNNING — Pause button appears again', async () => {
    render(<App />);
    const startBtn = await screen.findByLabelText('Start');
    await act(async () => {
      fireEvent.press(startBtn);
    });
    const pauseBtn = await screen.findByLabelText('Pause');
    await act(async () => {
      fireEvent.press(pauseBtn);
    });
    const resumeBtn = await screen.findByLabelText('Resume');
    await act(async () => {
      fireEvent.press(resumeBtn);
    });
    expect(await screen.findByLabelText('Pause')).toBeTruthy();
  });

  test('auto-transitions from focus to break when phaseEndAt elapses', async () => {
    render(<App />);
    expect(await screen.findByText('FOCUS')).toBeTruthy();
    const startBtn = await screen.findByLabelText('Start');
    await act(async () => {
      fireEvent.press(startBtn);
    });
    // Dev fast mode uses 10s focus / 5s break (DUR_DEV in App.js).
    // Advance past the focus phase with a buffer for the 250ms poll interval.
    await act(async () => {
      jest.advanceTimersByTime(11 * 1000);
    });
    await waitFor(() => {
      expect(screen.getByText('BREAK')).toBeTruthy();
    });
  });
});
