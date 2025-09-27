/**
 * Core timer types for PomodoroFlow
 * Minimal, focused type definitions for timer functionality
 */

export type TimerPhase = 'work' | 'break' | 'longBreak';

export type TimerState = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerData {
  phase: TimerPhase;
  timeRemaining: number; // in seconds
  state: TimerState;
  sessionCount: number;
  isLongBreak: boolean;
  lastUpdated: number; // timestamp for drift calculation
}

export interface SessionHistory {
  date: string; // YYYY-MM-DD format
  completedSessions: number;
  totalMinutes: number;
  streakCount: number;
}

export interface TimerSettings {
  workDuration: number; // in seconds, default 1500 (25 min)
  shortBreakDuration: number; // in seconds, default 300 (5 min)
  longBreakDuration: number; // in seconds, default 900 (15 min)
  sessionsUntilLongBreak: number; // default 4
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

export interface TimerEvents {
  onTick: (timeRemaining: number) => void;
  onPhaseChange: (newPhase: TimerPhase) => void;
  onSessionComplete: (sessionCount: number) => void;
  onTimerComplete: () => void;
  onStateChange: (newState: TimerState) => void;
}

// Storage schema for AsyncStorage
export interface StorageSchema {
  timerData: TimerData;
  sessionHistory: SessionHistory[];
  settings: TimerSettings;
  lastActiveDate: string;
}

// Component prop types
export interface TimerDisplayProps {
  timeRemaining: number;
  phase: TimerPhase;
  state: TimerState;
  sessionCount: number;
}

export interface ControlsProps {
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export interface SessionIndicatorProps {
  currentSession: number;
  totalSessions: number;
  isLongBreak: boolean;
}