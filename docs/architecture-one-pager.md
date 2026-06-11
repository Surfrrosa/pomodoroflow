# PomodoroFlow Architecture

Single-file React Native timer. All timer state lives in `mobile-app/App.js`. Wall-clock based, not interval counting. Background-reliable.

## State machine

Three state variables, three states:

| Variable | Type | Meaning |
|---|---|---|
| `phase` | `"focus" \| "break"` | Which side of the loop |
| `running` | `boolean` | Is the timer currently advancing |
| `phaseEndAt` | `number \| null` | Epoch ms when current phase ends |

States:

- **IDLE** — `phaseEndAt = null`, `running = false`. Cold start, or after Stop.
- **RUNNING** — `phaseEndAt = future epoch ms`, `running = true`. Timer is counting down.
- **PAUSED** — `phaseEndAt` preserved, `running = false`. Timer is held.

Transitions live in `App.js`:

- `onStart()` — IDLE → RUNNING (focus). Calls `startPhase("focus")`.
- `onPause()` — RUNNING → PAUSED. Clears the scheduled notification; preserves `phase` and `phaseEndAt`.
- `onResume()` — PAUSED → RUNNING. Recomputes `phaseEndAt` from the remaining time so the countdown picks up where it left off.
- `onStop()` — any → IDLE. Clears `phaseEndAt`, resets `phase = "focus"`, removes `TIMER_STATE` from AsyncStorage.
- **Auto-transition** — when the 250ms poll detects `Date.now() >= phaseEndAt`, fires chime + haptic, then calls `startPhase(opposite phase)`. Focus → break → focus, indefinitely.

The primary button's label is derived from this state machine (`App.js` `primaryLabel`): IDLE shows "Start", RUNNING shows "Pause", PAUSED shows "Resume".

## Wall-clock timing

`phaseEndAt = Date.now() + durationSec * 1000` is set on start. A 250ms `setInterval` (`App.js` lines 286-335) reads `endAtRef.current` and computes `remaining = (phaseEndAt - Date.now()) / 1000` for display.

Why wall-clock and not interval counting: mobile OSes suspend JavaScript when the app backgrounds. Interval-based countdowns drift. Storing the absolute end-time means the elapsed-time calculation is correct whether the app was foregrounded the whole phase or backgrounded for 20 of the 25 minutes.

## Foreground reconciliation

`AppState` listener (`App.js` lines 162-171) fires when the app returns from background/inactive to active. It re-computes `remaining = (phaseEndAt - Date.now()) / 1000` so the displayed countdown matches reality immediately on resume — no need to wait for the next poll tick.

## AsyncStorage

Single key for timer state: `STORAGE_KEYS.TIMER_STATE` (`'pomodoroflow_state'`), defined in `mobile-app/config/monetization.ts`. Shape: `{ phase, phaseStartAt, phaseEndAt }`. Written via `saveState()` on every start/resume; removed entirely on `onStop()`.

Streak + lifetime-session counts are persisted by StreakService under its own keys (`STREAK_COUNT`, `LIFETIME_SESSIONS`, `STREAK_LAST_SESSION_DATE`, also defined in `config/monetization.ts`).

## Notifications

Single scheduled local notification per phase. On `startPhase()`, `scheduleOnce()` (`App.js` line 187) calls `expo-notifications` `scheduleNotificationAsync` with a `date` trigger at `phaseEndAt`. Content varies by next phase ("Focus time!" or "Break time!"). On `onPause()`, `onStop()`, or the next schedule, the previous notification is cancelled via `cancelNotification()`.

A `lastScheduleKeyRef` guard prevents duplicate scheduling for the same end-time across back-to-back state changes.

## Services

Four leaf-pure services. Each imports only `config/monetization.ts` and Expo modules; none import each other. All are consumed exclusively by `App.js`.

- **AnalyticsService** (`services/AnalyticsService.js`) — Stub. `console.log` in dev, no-op in prod. Firebase was removed in v1.0.3.
- **ReviewPromptService** (`services/ReviewPromptService.js`) — Tracks total sessions, days since install, and last prompt date. Triggers `expo-store-review` at configured milestones (10 sessions, 7 days, 8-session productive day) with a 90-day cooldown.
- **StreakService** (`services/StreakService.js`) — Daily streak (recorded once per day on focus completion) + lifetime focus sessions. Persists to AsyncStorage with its own keys.
- **TipJarService** (`services/TipJarService.js`) — Tip-jar trigger logic (power-user / milestone / etc.). Drives the `TipJarModal` shown after focus completion. iOS only; backed by `expo-in-app-purchases`.

## Testing

`mobile-app/__tests__/App.test.js` covers:

- Smoke (renders without crash)
- IDLE initial state (Start button visible)
- IDLE → RUNNING transition (Start → Pause label)
- RUNNING → PAUSED preserves phase (Pause → Resume label)
- PAUSED → RUNNING via resume (Resume → Pause label)
- Auto-transition focus → break when `phaseEndAt` elapses

Tests use Jest + React Native Testing Library + `jest.useFakeTimers()` (configured globally in `jest-setup.js`). SplashScreen is mocked to immediately invoke `onComplete()` so the timer UI mounts in tests.

Intentionally not yet covered: notification scheduling/cancellation flow, IAP purchase flow, StreakService persistence across renders, ReviewPrompt cooldown logic. Each requires deeper mocking and would balloon the test surface; deferred to a focused integration-testing PR.

## Why single-file

The single-file architecture in `App.js` is intentional, not technical debt. CLAUDE.md captures it: "Radical simplicity — 25/5 on loop." A timer with two phases doesn't need a service layer.

The four services that DO exist (Analytics, ReviewPrompt, Streak, TipJar) are extracted because they're orthogonal to timer logic — they're side concerns that happen in response to timer events, not the timer itself.
