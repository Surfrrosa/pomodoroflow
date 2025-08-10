# Pomodoro Flow — QA Checklist (MVP)

Principle: **Radical Simplicity** — one tap, 25/5 loop, reliable alerts.

## Pre-Flight
- [ ] Build runs in Expo Go on iOS and Android.
- [ ] Dev Fast Mode available (25s/5s) and clearly labeled.
- [ ] Notifications permission requested once and granted.

## Core Loop (Fast Mode)
- [ ] Tap **Start** → shows **Focus** and a 25s countdown.
- [ ] At 0, auto-switches to **Break** (5s) with chime/haptic.
- [ ] At 0, auto-switches back to **Focus** with chime/haptic.
- [ ] Label and background colors match phase (Focus vs Break).

## Background Alerts
- [ ] While in Focus, lock phone → receive notification at phase end.
- [ ] Tap notification → app opens showing the **next** phase.
- [ ] No duplicate or late notifications.

## Pause / Resume
- [ ] Tap **Pause** mid-phase → countdown stops visually.
- [ ] Previous scheduled notification is **canceled** (no alert fires).
- [ ] Tap **Resume** → countdown continues with **new** notification scheduled.

## Stop / Reset
- [ ] Tap **Stop** → returns to Focus **25:00** (or 25s in dev mode).
- [ ] No pending notifications remain after Stop.

## Persistence
- [ ] Background the app for ~30–60s → return; time/phase correct.
- [ ] Kill the app, reopen → time/phase reconstructed from timestamps.

## Edge Cases
- [ ] Rapid Start → Pause → Resume doesn’t double-schedule notifications.
- [ ] Reopen exactly at phase end → app flips phase cleanly (no “-00:01”).
- [ ] DND on: vibration/notification still indicates phase change.
- [ ] Volume muted: haptic or alert still provides feedback.

## Visual / UX
- [ ] One primary button reflects state (Start → Pause → Resume → Stop).
- [ ] Countdown legible at arm’s length; color contrast acceptable.
- [ ] No settings or extra controls visible (MVP).

## Acceptance Criteria (Pass if all true)
- [ ] One-tap start loops **25/5** reliably.
- [ ] On-time alerts in foreground, background, and locked.
- [ ] Pause/Resume/Stop always cancel/reschedule notifications correctly.
- [ ] Survives background/kill via timestamp reconstruction.
- [ ] Dev Fast Mode behaves identically to real mode.

## Troubleshooting Notes
- If alerts don’t appear: recheck notification permission, then reinstall.
- If duplicate alerts: ensure previous notification is canceled on Pause/Stop.
- If time drifts: verify UI uses `phaseEndAt - now` (not a long-running JS timer).

## Pre-Release (TestFlight / Internal Testing)
- [ ] App icon + splash present.
- [ ] Privacy text explains local notifications only (no data collection).
- [ ] Short App Store description uses “**radical simplicity**” and 25/5 loop.
