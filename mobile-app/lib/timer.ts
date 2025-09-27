/**
 * Hardened Pomodoro Timer Service
 * Handles drift compensation, persistence, and robust state management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { AppState, AppStateStatus } from 'react-native';

import type {
  TimerData,
  TimerPhase,
  TimerState,
  TimerSettings,
  TimerEvents,
  SessionHistory,
  StorageSchema
} from '../types/timer';

const STORAGE_KEYS = {
  TIMER_DATA: '@pomodoroflow:timer_data',
  SESSION_HISTORY: '@pomodoroflow:session_history',
  SETTINGS: '@pomodoroflow:settings',
} as const;

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25 * 60, // 25 minutes
  shortBreakDuration: 5 * 60, // 5 minutes
  longBreakDuration: 15 * 60, // 15 minutes
  sessionsUntilLongBreak: 4,
  notificationsEnabled: true,
  soundEnabled: true,
  hapticEnabled: true,
};

export class PomodoroTimer {
  private timerData: TimerData;
  private settings: TimerSettings;
  private events: Partial<TimerEvents>;
  private intervalId: NodeJS.Timeout | null = null;
  private backgroundTime: number | null = null;
  private appStateSubscription: any = null;

  constructor(events: Partial<TimerEvents> = {}) {
    this.events = events;
    this.settings = DEFAULT_SETTINGS;
    this.timerData = this.createInitialTimerData();
    this.setupAppStateHandling();
  }

  private createInitialTimerData(): TimerData {
    return {
      phase: 'work',
      timeRemaining: DEFAULT_SETTINGS.workDuration,
      state: 'idle',
      sessionCount: 1,
      isLongBreak: false,
      lastUpdated: Date.now(),
    };
  }

  private setupAppStateHandling(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background' && this.timerData.state === 'running') {
      this.backgroundTime = Date.now();
    } else if (nextAppState === 'active' && this.backgroundTime) {
      this.compensateForBackgroundTime();
      this.backgroundTime = null;
    }
  }

  private compensateForBackgroundTime(): void {
    if (!this.backgroundTime || this.timerData.state !== 'running') return;

    const now = Date.now();
    const backgroundDuration = Math.floor((now - this.backgroundTime) / 1000);

    this.timerData.timeRemaining = Math.max(0, this.timerData.timeRemaining - backgroundDuration);
    this.timerData.lastUpdated = now;

    if (this.timerData.timeRemaining <= 0) {
      this.completeCurrentPhase();
    }

    this.notifyListeners();
  }

  async start(): Promise<void> {
    if (this.timerData.state === 'running') return;

    try {
      this.timerData.state = 'running';
      this.timerData.lastUpdated = Date.now();

      this.startTicking();
      await this.saveTimerData();

      if (this.settings.hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      this.events.onStateChange?.(this.timerData.state);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to start timer:', error);
      this.timerData.state = 'idle';
    }
  }

  async pause(): Promise<void> {
    if (this.timerData.state !== 'running') return;

    try {
      this.timerData.state = 'paused';
      this.stopTicking();
      await this.saveTimerData();

      this.events.onStateChange?.(this.timerData.state);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  }

  async resume(): Promise<void> {
    if (this.timerData.state !== 'paused') return;
    await this.start();
  }

  async reset(): Promise<void> {
    try {
      this.stopTicking();
      this.timerData = this.createInitialTimerData();
      await this.saveTimerData();
      await this.clearScheduledNotifications();

      this.events.onStateChange?.(this.timerData.state);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  }

  private startTicking(): void {
    this.stopTicking(); // Ensure no duplicate intervals

    this.intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - this.timerData.lastUpdated) / 1000);

      // Compensate for any drift
      this.timerData.timeRemaining = Math.max(0, this.timerData.timeRemaining - elapsed);
      this.timerData.lastUpdated = now;

      this.events.onTick?.(this.timerData.timeRemaining);
      this.notifyListeners();

      if (this.timerData.timeRemaining <= 0) {
        this.completeCurrentPhase();
      }
    }, 1000);
  }

  private stopTicking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async completeCurrentPhase(): Promise<void> {
    try {
      this.stopTicking();

      const wasWorkSession = this.timerData.phase === 'work';

      if (wasWorkSession) {
        await this.recordCompletedSession();
        this.events.onSessionComplete?.(this.timerData.sessionCount);
      }

      // Determine next phase
      const nextPhase = this.calculateNextPhase();
      this.transitionToPhase(nextPhase);

      // Notifications and haptics
      await this.triggerPhaseCompleteEffects();

      this.events.onPhaseChange?.(this.timerData.phase);
      this.events.onTimerComplete?.();

      await this.saveTimerData();
      this.notifyListeners();

      // Auto-start next phase after brief delay
      setTimeout(() => {
        if (this.timerData.state === 'completed') {
          this.start();
        }
      }, 3000);

    } catch (error) {
      console.error('Failed to complete phase:', error);
    }
  }

  private calculateNextPhase(): TimerPhase {
    if (this.timerData.phase === 'work') {
      // Completed a work session
      if (this.timerData.sessionCount % this.settings.sessionsUntilLongBreak === 0) {
        return 'longBreak';
      }
      return 'break';
    } else {
      // Completed a break, back to work
      return 'work';
    }
  }

  private transitionToPhase(phase: TimerPhase): void {
    this.timerData.phase = phase;
    this.timerData.state = 'completed';
    this.timerData.isLongBreak = phase === 'longBreak';
    this.timerData.lastUpdated = Date.now();

    // Set duration for new phase
    switch (phase) {
      case 'work':
        this.timerData.timeRemaining = this.settings.workDuration;
        if (this.timerData.phase !== 'work') {
          // Only increment session when returning from break to work
          this.timerData.sessionCount++;
        }
        break;
      case 'break':
        this.timerData.timeRemaining = this.settings.shortBreakDuration;
        break;
      case 'longBreak':
        this.timerData.timeRemaining = this.settings.longBreakDuration;
        break;
    }
  }

  private async triggerPhaseCompleteEffects(): Promise<void> {
    try {
      // Haptic feedback
      if (this.settings.hapticEnabled) {
        const impactStyle = this.timerData.isLongBreak
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium;
        await Haptics.impactAsync(impactStyle);
      }

      // Schedule notification for next phase end
      if (this.settings.notificationsEnabled) {
        await this.schedulePhaseEndNotification();
      }
    } catch (error) {
      console.error('Failed to trigger phase effects:', error);
    }
  }

  private async schedulePhaseEndNotification(): Promise<void> {
    try {
      await this.clearScheduledNotifications();

      const notificationContent = this.getNotificationContent();

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          seconds: this.timerData.timeRemaining,
        } as any,
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  private getNotificationContent(): Notifications.NotificationContentInput {
    const isWorkPhase = this.timerData.phase === 'work';

    return {
      title: isWorkPhase ? 'Break Time!' : 'Focus Time!',
      body: isWorkPhase
        ? `Great work! Time for a ${this.timerData.isLongBreak ? 'long ' : ''}break.`
        : 'Break\'s over. Ready to focus?',
      sound: this.settings.soundEnabled ? 'default' : false,
    };
  }

  private async clearScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  private async recordCompletedSession(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const history = await this.getSessionHistory();

      const todayEntry = history.find(entry => entry.date === today);

      if (todayEntry) {
        todayEntry.completedSessions++;
        todayEntry.totalMinutes += Math.floor(this.settings.workDuration / 60);
        todayEntry.streakCount = this.calculateStreak(history);
      } else {
        history.push({
          date: today,
          completedSessions: 1,
          totalMinutes: Math.floor(this.settings.workDuration / 60),
          streakCount: this.calculateStreak(history) + 1,
        });
      }

      await this.saveSessionHistory(history);
    } catch (error) {
      console.error('Failed to record session:', error);
    }
  }

  private calculateStreak(history: SessionHistory[]): number {
    // Simple streak calculation - can be enhanced
    const sorted = history.sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;

    for (const entry of sorted) {
      if (entry.completedSessions > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Storage methods
  private async saveTimerData(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TIMER_DATA, JSON.stringify(this.timerData));
    } catch (error) {
      console.error('Failed to save timer data:', error);
    }
  }

  private async saveSessionHistory(history: SessionHistory[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save session history:', error);
    }
  }

  private async getSessionHistory(): Promise<SessionHistory[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load session history:', error);
      return [];
    }
  }

  async loadFromStorage(): Promise<void> {
    try {
      const [timerData, settings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TIMER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      if (timerData) {
        this.timerData = { ...this.createInitialTimerData(), ...JSON.parse(timerData) };
      }

      if (settings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settings) };
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }

  private notifyListeners(): void {
    // Emit current state to all listeners
    this.events.onTick?.(this.timerData.timeRemaining);
  }

  // Public getters
  getTimerData(): Readonly<TimerData> {
    return { ...this.timerData };
  }

  getSettings(): Readonly<TimerSettings> {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<TimerSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  }

  destroy(): void {
    this.stopTicking();
    if (this.appStateSubscription) {
      this.appStateSubscription?.remove();
    }
  }
}