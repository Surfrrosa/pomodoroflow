/**
 * Controls component tests
 * Testing timer control interactions and accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Controls } from '../../components/Controls';
import type { ControlsProps } from '../../types/timer';

describe('Controls Component', () => {
  const mockHandlers = {
    onStart: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onReset: jest.fn(),
  };

  const defaultProps: ControlsProps = {
    state: 'idle',
    ...mockHandlers,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Idle State', () => {
    it('should show start button when idle', () => {
      render(<Controls {...defaultProps} />);

      const startButton = screen.getByText('START');
      expect(startButton).toBeTruthy();
      expect(screen.queryByText('PAUSE')).toBeNull();
      expect(screen.queryByText('RESUME')).toBeNull();
    });

    it('should call onStart when start button is pressed', () => {
      render(<Controls {...defaultProps} />);

      const startButton = screen.getByText('START');
      fireEvent.press(startButton);

      expect(mockHandlers.onStart).toHaveBeenCalledTimes(1);
    });

    it('should have proper accessibility labels for start button', () => {
      render(<Controls {...defaultProps} />);

      const startButton = screen.getByLabelText('Start timer');
      expect(startButton).toBeTruthy();

      const startHint = screen.getByHintText('Begins 25-minute focus session');
      expect(startHint).toBeTruthy();
    });
  });

  describe('Running State', () => {
    const runningProps: ControlsProps = {
      ...defaultProps,
      state: 'running',
    };

    it('should show pause and reset buttons when running', () => {
      render(<Controls {...runningProps} />);

      expect(screen.getByText('PAUSE')).toBeTruthy();
      expect(screen.getByText('RESET')).toBeTruthy();
      expect(screen.queryByText('START')).toBeNull();
    });

    it('should call onPause when pause button is pressed', () => {
      render(<Controls {...runningProps} />);

      const pauseButton = screen.getByText('PAUSE');
      fireEvent.press(pauseButton);

      expect(mockHandlers.onPause).toHaveBeenCalledTimes(1);
    });

    it('should call onReset when reset button is pressed', () => {
      render(<Controls {...runningProps} />);

      const resetButton = screen.getByText('RESET');
      fireEvent.press(resetButton);

      expect(mockHandlers.onReset).toHaveBeenCalledTimes(1);
    });

    it('should have proper accessibility labels for running state', () => {
      render(<Controls {...runningProps} />);

      const pauseButton = screen.getByLabelText('Pause timer');
      expect(pauseButton).toBeTruthy();

      const resetButton = screen.getByLabelText('Reset timer');
      expect(resetButton).toBeTruthy();
    });
  });

  describe('Paused State', () => {
    const pausedProps: ControlsProps = {
      ...defaultProps,
      state: 'paused',
    };

    it('should show resume and reset buttons when paused', () => {
      render(<Controls {...pausedProps} />);

      expect(screen.getByText('RESUME')).toBeTruthy();
      expect(screen.getByText('RESET')).toBeTruthy();
      expect(screen.queryByText('START')).toBeNull();
      expect(screen.queryByText('PAUSE')).toBeNull();
    });

    it('should call onResume when resume button is pressed', () => {
      render(<Controls {...pausedProps} />);

      const resumeButton = screen.getByText('RESUME');
      fireEvent.press(resumeButton);

      expect(mockHandlers.onResume).toHaveBeenCalledTimes(1);
    });

    it('should have proper accessibility labels for paused state', () => {
      render(<Controls {...pausedProps} />);

      const resumeButton = screen.getByLabelText('Resume timer');
      expect(resumeButton).toBeTruthy();
    });
  });

  describe('Touch Targets', () => {
    it('should have minimum 44x44 touch targets', () => {
      render(<Controls {...defaultProps} />);

      const startButton = screen.getByText('START');
      const buttonStyle = startButton.props.style;

      // Should have minimum dimensions for accessibility
      expect(buttonStyle).toEqual(
        expect.objectContaining({
          minHeight: 44,
          minWidth: 44,
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<Controls {...defaultProps} />);

      const startButton = screen.getByRole('button', { name: 'Start timer' });
      expect(startButton).toBeTruthy();
    });

    it('should be focusable for screen readers', () => {
      render(<Controls {...defaultProps} />);

      const startButton = screen.getByText('START');
      expect(startButton.props.accessible).toBe(true);
    });

    it('should have clear button states for screen readers', () => {
      const { rerender } = render(<Controls {...defaultProps} state="idle" />);

      // Idle state
      expect(screen.getByLabelText('Start timer')).toBeTruthy();

      // Running state
      rerender(<Controls {...defaultProps} state="running" />);
      expect(screen.getByLabelText('Pause timer')).toBeTruthy();

      // Paused state
      rerender(<Controls {...defaultProps} state="paused" />);
      expect(screen.getByLabelText('Resume timer')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button presses', () => {
      render(<Controls {...defaultProps} />);

      const startButton = screen.getByText('START');

      // Rapid fire
      for (let i = 0; i < 10; i++) {
        fireEvent.press(startButton);
      }

      expect(mockHandlers.onStart).toHaveBeenCalledTimes(10);
    });

    it('should handle completed state appropriately', () => {
      render(<Controls {...defaultProps} state="completed" />);

      // Should show start button to begin next phase
      expect(screen.getByText('START')).toBeTruthy();
    });
  });
});