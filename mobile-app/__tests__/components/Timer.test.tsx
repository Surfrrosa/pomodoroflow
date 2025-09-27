/**
 * Timer component tests
 * Testing the display and interaction logic
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Timer } from '../../components/Timer';
import type { TimerDisplayProps } from '../../types/timer';

describe('Timer Component', () => {
  const defaultProps: TimerDisplayProps = {
    timeRemaining: 1500, // 25 minutes
    phase: 'work',
    state: 'idle',
    sessionCount: 1,
  };

  it('should render time in MM:SS format', () => {
    render(<Timer {...defaultProps} />);

    expect(screen.getByText('25:00')).toBeTruthy();
  });

  it('should display correct phase label', () => {
    render(<Timer {...defaultProps} />);

    expect(screen.getByText('FOCUS')).toBeTruthy();
  });

  it('should show break phase correctly', () => {
    render(
      <Timer
        {...defaultProps}
        phase="break"
        timeRemaining={300} // 5 minutes
      />
    );

    expect(screen.getByText('05:00')).toBeTruthy();
    expect(screen.getByText('BREAK')).toBeTruthy();
  });

  it('should show long break phase correctly', () => {
    render(
      <Timer
        {...defaultProps}
        phase="longBreak"
        timeRemaining={900} // 15 minutes
      />
    );

    expect(screen.getByText('15:00')).toBeTruthy();
    expect(screen.getByText('LONG BREAK')).toBeTruthy();
  });

  it('should format single digit minutes and seconds correctly', () => {
    render(
      <Timer
        {...defaultProps}
        timeRemaining={65} // 1 minute 5 seconds
      />
    );

    expect(screen.getByText('01:05')).toBeTruthy();
  });

  it('should handle zero time correctly', () => {
    render(
      <Timer
        {...defaultProps}
        timeRemaining={0}
      />
    );

    expect(screen.getByText('00:00')).toBeTruthy();
  });

  it('should have proper accessibility labels', () => {
    render(<Timer {...defaultProps} />);

    const timerDisplay = screen.getByLabelText('Timer: 25 minutes remaining in focus session');
    expect(timerDisplay).toBeTruthy();
  });

  it('should update accessibility label for different phases', () => {
    render(
      <Timer
        {...defaultProps}
        phase="break"
        timeRemaining={300}
      />
    );

    const timerDisplay = screen.getByLabelText('Timer: 5 minutes remaining in break session');
    expect(timerDisplay).toBeTruthy();
  });

  it('should indicate running state visually', () => {
    const { rerender } = render(<Timer {...defaultProps} state="idle" />);

    // Should not have running indicator
    expect(screen.queryByTestId('timer-running-indicator')).toBeNull();

    rerender(<Timer {...defaultProps} state="running" />);

    // Should have running indicator
    expect(screen.getByTestId('timer-running-indicator')).toBeTruthy();
  });

  it('should show session count correctly', () => {
    render(
      <Timer
        {...defaultProps}
        sessionCount={3}
      />
    );

    expect(screen.getByText(/Session 3/)).toBeTruthy();
  });
});