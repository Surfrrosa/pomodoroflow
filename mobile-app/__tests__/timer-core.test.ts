/**
 * Core timer logic unit tests
 * Testing the essential timer functionality without UI dependencies
 */

// Simple timer core for testing business logic
interface TimerCore {
  timeRemaining: number;
  phase: 'work' | 'break' | 'longBreak';
  state: 'idle' | 'running' | 'paused' | 'completed';
  sessionCount: number;
  isLongBreak: boolean;
}

interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

class SimpleTimerCore {
  private data: TimerCore;
  private settings: TimerSettings;
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = {
      workDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      sessionsUntilLongBreak: 4,
    };

    this.data = {
      timeRemaining: this.settings.workDuration,
      phase: 'work',
      state: 'idle',
      sessionCount: 1,
      isLongBreak: false,
    };
  }

  getTimerData(): TimerCore {
    return { ...this.data };
  }

  getSettings(): TimerSettings {
    return { ...this.settings };
  }

  start(): void {
    if (this.data.state === 'running') return;

    this.data.state = 'running';
    this.interval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  pause(): void {
    if (this.data.state !== 'running') return;

    this.data.state = 'paused';
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  resume(): void {
    if (this.data.state !== 'paused') return;
    this.start();
  }

  reset(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.data = {
      timeRemaining: this.settings.workDuration,
      phase: 'work',
      state: 'idle',
      sessionCount: 1,
      isLongBreak: false,
    };
  }

  private tick(): void {
    if (this.data.timeRemaining > 0) {
      this.data.timeRemaining--;
    } else {
      this.completePhase();
    }
  }

  private completePhase(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.data.state = 'completed';

    if (this.data.phase === 'work') {
      // Determine next break type
      const isLongBreak = this.data.sessionCount % this.settings.sessionsUntilLongBreak === 0;

      this.data.phase = isLongBreak ? 'longBreak' : 'break';
      this.data.isLongBreak = isLongBreak;
      this.data.timeRemaining = isLongBreak
        ? this.settings.longBreakDuration
        : this.settings.shortBreakDuration;
    } else {
      // Break completed, start next work session
      this.data.phase = 'work';
      this.data.isLongBreak = false;
      this.data.sessionCount++;
      this.data.timeRemaining = this.settings.workDuration;
    }
  }

  updateSettings(newSettings: Partial<TimerSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  destroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

describe('Timer Core Logic', () => {
  let timer: SimpleTimerCore;

  beforeEach(() => {
    jest.useFakeTimers();
    timer = new SimpleTimerCore();
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
      expect(timerData.timeRemaining).toBe(25 * 60);
      expect(timerData.sessionCount).toBe(1);
      expect(timerData.isLongBreak).toBe(false);
    });

    it('should have correct default settings', () => {
      const settings = timer.getSettings();

      expect(settings.workDuration).toBe(25 * 60);
      expect(settings.shortBreakDuration).toBe(5 * 60);
      expect(settings.longBreakDuration).toBe(15 * 60);
      expect(settings.sessionsUntilLongBreak).toBe(4);
    });
  });

  describe('Timer Controls', () => {
    it('should start timer correctly', () => {
      timer.start();

      const timerData = timer.getTimerData();
      expect(timerData.state).toBe('running');
    });

    it('should not start if already running', () => {
      timer.start();
      const initialState = timer.getTimerData().state;

      timer.start();

      const finalState = timer.getTimerData().state;
      expect(finalState).toBe(initialState);
      expect(finalState).toBe('running');
    });

    it('should pause timer correctly', () => {
      timer.start();
      timer.pause();

      const timerData = timer.getTimerData();
      expect(timerData.state).toBe('paused');
    });

    it('should resume from paused state', () => {
      timer.start();
      timer.pause();
      timer.resume();

      const timerData = timer.getTimerData();
      expect(timerData.state).toBe('running');
    });

    it('should reset timer to initial state', () => {
      timer.start();
      jest.advanceTimersByTime(5000);

      timer.reset();

      const timerData = timer.getTimerData();
      expect(timerData.state).toBe('idle');
      expect(timerData.phase).toBe('work');
      expect(timerData.timeRemaining).toBe(25 * 60);
      expect(timerData.sessionCount).toBe(1);
    });
  });

  describe('Timer Progression', () => {
    it('should tick down every second', () => {
      timer.start();

      jest.advanceTimersByTime(3000);

      const timerData = timer.getTimerData();
      expect(timerData.timeRemaining).toBe(25 * 60 - 3);
    });

    it('should complete work session and transition to break', () => {
      timer.updateSettings({ workDuration: 2 });
      timer.reset();
      timer.start();

      jest.advanceTimersByTime(3000);

      const timerData = timer.getTimerData();
      expect(timerData.phase).toBe('break');
      expect(timerData.state).toBe('completed');
      expect(timerData.isLongBreak).toBe(false);
    });

    it('should transition to long break after 4th session', () => {
      timer.updateSettings({
        workDuration: 1,
        shortBreakDuration: 1,
      });

      // Complete 4 work sessions
      for (let i = 1; i <= 4; i++) {
        // Reset only on first iteration to start fresh
        if (i === 1) timer.reset();

        timer.start();
        jest.advanceTimersByTime(2000); // Complete work session

        const workData = timer.getTimerData();

        if (i < 4) {
          expect(workData.phase).toBe('break');
          expect(workData.isLongBreak).toBe(false);
          // Complete break to advance to next session
          jest.advanceTimersByTime(2000);
        } else {
          expect(workData.phase).toBe('longBreak');
          expect(workData.isLongBreak).toBe(true);
        }
      }
    });

    it('should not go below 0 time remaining', () => {
      timer.updateSettings({ workDuration: 5 });
      timer.reset();
      timer.start();

      jest.advanceTimersByTime(10000);

      const timerData = timer.getTimerData();
      expect(timerData.timeRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Settings Management', () => {
    it('should update settings correctly', () => {
      const newSettings = {
        workDuration: 30 * 60,
        sessionsUntilLongBreak: 3,
      };

      timer.updateSettings(newSettings);

      const settings = timer.getSettings();
      expect(settings.workDuration).toBe(30 * 60);
      expect(settings.sessionsUntilLongBreak).toBe(3);
      expect(settings.shortBreakDuration).toBe(5 * 60); // Should preserve other settings
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop cycles', () => {
      for (let i = 0; i < 10; i++) {
        timer.start();
        timer.pause();
      }

      const timerData = timer.getTimerData();
      expect(['idle', 'paused', 'running']).toContain(timerData.state);
    });

    it('should handle timer completing at exactly 0 seconds', () => {
      timer.updateSettings({ workDuration: 1 });
      timer.reset();
      timer.start();

      jest.advanceTimersByTime(1000);

      const timerData = timer.getTimerData();
      expect(timerData.state).toBe('completed');
      expect(timerData.phase).toBe('break');
    });
  });
});