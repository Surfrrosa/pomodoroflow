import AsyncStorage from '@react-native-async-storage/async-storage';
import TipJarService from '../services/TipJarService';

describe('TipJarService.checkTriggers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
  });

  test('under threshold — no trigger', async () => {
    const result = await TipJarService.checkTriggers(24, 5);
    expect(result).toEqual({ shouldShow: false });
  });

  test('exactly at power-user threshold — fires', async () => {
    const result = await TipJarService.checkTriggers(25, 5);
    expect(result).toEqual({ shouldShow: true, trigger: 'power_user' });
  });

  test('past power-user threshold — still fires (regression: === bug)', async () => {
    // Before the >= fix, a user who blew past 25 without a check running
    // (e.g. background completion, race with save) would never see the prompt.
    const result = await TipJarService.checkTriggers(100, 5);
    expect(result).toEqual({ shouldShow: true, trigger: 'power_user' });
  });

  test('anniversary exactly at day 30 with 15 sessions — fires', async () => {
    const result = await TipJarService.checkTriggers(15, 30);
    expect(result).toEqual({ shouldShow: true, trigger: 'anniversary' });
  });

  test('anniversary past day 30 with 15+ sessions — still fires (regression: === bug)', async () => {
    const result = await TipJarService.checkTriggers(20, 45);
    // Power-user fires first since totalSessions >= 25 is false here (20 < 25),
    // so anniversary path is reached.
    expect(result).toEqual({ shouldShow: true, trigger: 'anniversary' });
  });

  test('anniversary path skipped when session floor not met', async () => {
    const result = await TipJarService.checkTriggers(10, 45);
    expect(result).toEqual({ shouldShow: false });
  });

  test('already fired trigger does not re-fire', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@pomodoroflow:tip_jar_triggers_fired') {
        return Promise.resolve(JSON.stringify(['power_user']));
      }
      return Promise.resolve(null);
    });
    const result = await TipJarService.checkTriggers(100, 5);
    expect(result).toEqual({ shouldShow: false });
  });

  test('user already donated — no trigger', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@pomodoroflow:user_has_donated') return Promise.resolve('true');
      return Promise.resolve(null);
    });
    const result = await TipJarService.checkTriggers(100, 5);
    expect(result).toEqual({ shouldShow: false });
  });
});
