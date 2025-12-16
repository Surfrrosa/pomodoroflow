// mobile-app/App.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch, AppState, Platform, Modal, Alert } from "react-native";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { SplashScreen } from "./components/SplashScreen";
import { PremiumProvider, usePremium } from "./components/PremiumProvider";
import { UpgradePrompt } from "./components/UpgradePrompt";
import { TipJarModal } from "./components/TipJarModal";
import AnalyticsService from "./services/AnalyticsService";
import ReviewPromptService from "./services/ReviewPromptService";
import SessionTrackingService from "./services/SessionTrackingService";
import TipJarService from "./services/TipJarService";
import { STORAGE_KEYS } from "./config/monetization";

const NOTIFS_ENABLED = process.env.NOTIFS_ENABLED !== 'false';

// Real vs dev durations
const DUR = { focus: 25 * 60, break: 5 * 60 };
const DUR_DEV = { focus: 10, break: 5 }; // fast mode for QA - 10 seconds

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState("focus");            // "focus" | "break"
  const [running, setRunning] = useState(false);
  const [fast, setFast] = useState(__DEV__);
  const [phaseEndAt, setPhaseEndAt] = useState(null);     // epoch ms
  const [remaining, setRemaining] = useState(0);          // seconds left for display
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showTipJar, setShowTipJar] = useState(false);
  const [tipJarTrigger, setTipJarTrigger] = useState('power_user');

  const { premiumStatus, canStartSession } = usePremium();
  const durations = useMemo(() => (fast ? DUR_DEV : DUR), [fast]);

  const endAtRef = useRef(null);           // read by interval without re-rendering
  const notificationIdRef = useRef(null);  // currently scheduled local notif id
  const lastScheduleKeyRef = useRef(null); // prevent duplicate scheduling
  const appState = useRef(AppState.currentState);
  const soundRef = useRef(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (__DEV__) console.log('[NOTIF] Starting app cleanup...');
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.dismissAllNotificationsAsync();
        const remaining = await Notifications.getAllScheduledNotificationsAsync();
        if (__DEV__) console.log('[NOTIF] Scheduled after cleanup:', remaining);

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFFFFF',
          });
          if (__DEV__) console.log('[NOTIF] Android channel configured');
        }

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted" && __DEV__) console.warn("Notification permissions not granted");
        if (__DEV__) console.log('[NOTIF] Permissions status:', status);
      } catch (e) {
        if (__DEV__) console.warn("Failed to initialize notifications:", e);
      }
    };

    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.TIMER_STATE);
        if (stored) {
          const { phase: storedPhase, phaseEndAt: storedEndAt } = JSON.parse(stored);
          const now = Date.now();
          if (storedEndAt && now < storedEndAt) {
            setPhase(storedPhase);
            setPhaseEndAt(storedEndAt);
            setRemaining(Math.max(0, Math.floor((storedEndAt - now) / 1000)));
            setRunning(true);
          } else if (storedEndAt && now >= storedEndAt) {
            const elapsed = now - storedEndAt;
            const nextPhase = storedPhase === "focus" ? "break" : "focus";
            const nextDur = storedPhase === "focus" ? durations.break : durations.focus;
            if (elapsed < nextDur * 1000) {
              const newEnd = storedEndAt + nextDur * 1000;
              setPhase(nextPhase);
              setPhaseEndAt(newEnd);
              setRemaining(Math.max(0, Math.floor((newEnd - now) / 1000)));
              setRunning(true);
            } else {
              setPhase("focus");
              setPhaseEndAt(null);
              setRemaining(0);
              setRunning(false);
            }
          }
        }
      } catch (e) {
        if (__DEV__) console.warn("Failed to load state:", e);
      }
    };

    // Premium status loading removed for v1.0
    // const loadPremiumStatus = async () => { ... };

    // Initialize session tracking (legacy user detection, install date)
    const initializeSessionTracking = async () => {
      try {
        await SessionTrackingService.initialize();
      } catch (error) {
        if (__DEV__) console.warn('Failed to initialize session tracking:', error);
      }
    };

    initializeApp();
    loadState();
    initializeSessionTracking();
  }, [durations]);

  useEffect(() => {
    (async () => {
      try {
        // Removed setAudioModeAsync to avoid UIBackgroundModes audio requirement (App Store Guideline 2.5.4)
        // Sound will now respect device silent mode - this is acceptable for a pomodoro timer chime
        const { sound } = await Audio.Sound.createAsync(require("./assets/chime.mp3"));
        soundRef.current = sound;
      } catch (e) {
        if (__DEV__) console.warn("Chime not loaded. Add assets/chime.mp3", e?.message);
      }
    })();
    return () => soundRef.current?.unloadAsync();
  }, []);

  useEffect(() => {
    if (__DEV__) console.log('[NOTIF] Registering notification listeners');

    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) console.log('[NOTIF] Notification received:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (__DEV__) console.log('[NOTIF] Notification response:', response);
    });

    return () => {
      if (__DEV__) console.log('[NOTIF] Cleaning up notification listeners');
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => { endAtRef.current = phaseEndAt; }, [phaseEndAt]);

  useEffect(() => {
    const onState = (next) => {
      if (appState.current.match(/inactive|background/) && next === "active" && phaseEndAt) {
        setRemaining(Math.max(0, Math.floor((phaseEndAt - Date.now()) / 1000)));
      }
      appState.current = next;
    };
    const sub = AppState.addEventListener("change", onState);
    return () => sub?.remove();
  }, [phaseEndAt]);

  const cancelNotification = async () => {
    if (!NOTIFS_ENABLED) return;

    if (notificationIdRef.current) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
        if (__DEV__) console.log('[NOTIF] Cancelled notification:', notificationIdRef.current);
      } catch (e) {
        if (__DEV__) console.warn('[NOTIF] Failed to cancel notification:', e);
      }
      notificationIdRef.current = null;
    }
  };

  const scheduleOnce = async ({ title, body, endTime, label }) => {
    if (!NOTIFS_ENABLED) return null;

    const key = `${label}-${Math.floor(endTime / 1000)}`; // Round to nearest second

    if (lastScheduleKeyRef.current === key) {
      if (__DEV__) console.log('[NOTIF] Skipping duplicate schedule:', key);
      return null;
    }

    // Always cancel existing notifications first
    await cancelNotification();

    try {
      if (__DEV__) console.log('[NOTIF] Scheduling notification:', { key, endTime, title });
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: { phase: label, scheduledAt: endTime }
        },
        trigger: { type: 'date', date: new Date(endTime) },
      });

      notificationIdRef.current = id;
      lastScheduleKeyRef.current = key;
      if (__DEV__) console.log('[NOTIF] Notification scheduled successfully:', id);
      return id;
    } catch (e) {
      if (__DEV__) console.warn('[NOTIF] Failed to schedule notification:', e);
      return null;
    }
  };

  const schedulePhaseNotification = async (endTime, nextPhase) => {
    const title = nextPhase === "focus" ? "Focus time!" : "Break time!";
    const body = nextPhase === "focus" ? "Ready to focus? Let's do this!" : "Great work! Time for a well-deserved break.";

    if (__DEV__) console.log(`[NOTIF DEBUG] About to schedule: ${title} in ${Math.floor((endTime - Date.now()) / 1000)} seconds`);

    return scheduleOnce({ title, body, endTime, label: nextPhase });
  };

  const saveState = async (p, end) => {
    try { await AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify({ phase: p, phaseStartAt: Date.now(), phaseEndAt: end })); }
    catch (e) { if (__DEV__) console.warn("Failed to save state:", e); }
  };

  const startPhase = async (next) => {
    const seconds = next === "focus" ? durations.focus : durations.break;
    const end = Date.now() + seconds * 1000;
    setPhase(next);
    setPhaseEndAt(end);
    setRemaining(seconds);
    setRunning(true);
    await saveState(next, end);
    const nextPhase = next === "focus" ? "break" : "focus";
    await schedulePhaseNotification(end, nextPhase);

    // Track session start
    await AnalyticsService.logSessionStart(next, seconds);
  };

  const onStart = async () => {
    // Check if user can start a new session using PremiumProvider
    const canStart = canStartSession();

    if (__DEV__) {
      console.log('[FREEMIUM] Start session check:', {
        canStart,
        isPremium: premiumStatus.isPremium,
        dailySessionsUsed: premiumStatus.dailySessionsUsed,
        dailySessionsLimit: premiumStatus.dailySessionsLimit
      });
    }

    if (!canStart) {
      // User hit daily limit - show upgrade prompt
      await AnalyticsService.logSessionLimitReached(premiumStatus.isPremium);
      setShowUpgrade(true);
      return;
    }

    // Check if approaching limit (show warning)
    const sessionsRemaining = Math.max(0, premiumStatus.dailySessionsLimit - premiumStatus.dailySessionsUsed);
    if (sessionsRemaining <= 2 && sessionsRemaining > 0 && !premiumStatus.isPremium && premiumStatus.dailySessionsLimit !== Infinity) {
      await AnalyticsService.logSessionLimitWarning(sessionsRemaining);
    }

    startPhase("focus");
  };
  const onPause  = async () => {
    setRunning(false);
    await cancelNotification();
    // Track session pause
    await AnalyticsService.logSessionPause(phase, remaining);
  };
  const onStop   = async () => {
    // Track session stop
    await AnalyticsService.logSessionStop(phase, remaining);

    setRunning(false);
    setPhase("focus");
    setPhaseEndAt(null);
    setRemaining(0);
    await cancelNotification();
    await AsyncStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
  };
  const onResume = async () => {
    if (!phaseEndAt) return;
    const remainMs = Math.max(0, phaseEndAt - Date.now());
    const newEnd = Date.now() + remainMs;
    setPhaseEndAt(newEnd);
    setRemaining(Math.floor(remainMs / 1000));
    setRunning(true);
    await saveState(phase, newEnd);
    const nextPhase = phase === "focus" ? "break" : "focus";
    await schedulePhaseNotification(newEnd, nextPhase);

    // Track session resume
    await AnalyticsService.logSessionResume(phase, Math.floor(remainMs / 1000));
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(async () => {
      const end = endAtRef.current;
      if (!end) return;

      const now = Date.now();
      if (now >= end) {
        try { await soundRef.current?.replayAsync(); } catch {}
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}

        // Track session completion
        const completedPhase = phase;
        const duration = completedPhase === "focus" ? durations.focus : durations.break;
        await AnalyticsService.logSessionComplete(completedPhase, duration);

        // Increment session count and check for review prompts (focus sessions only)
        if (completedPhase === "focus") {
          const totalSessions = await ReviewPromptService.incrementTotalSessions();
          await SessionTrackingService.incrementDailySession();

          // Check tip jar triggers (after review prompts)
          const daysSinceInstall = await ReviewPromptService.getDaysSinceInstall();
          const tipJarCheck = await TipJarService.checkTriggers(totalSessions, daysSinceInstall);

          if (tipJarCheck.shouldShow) {
            setTipJarTrigger(tipJarCheck.trigger);
            setShowTipJar(true);
          }
        }

        // Clear any existing notifications first
        await cancelNotification();

        // Transition to next phase
        await startPhase(phase === "focus" ? "break" : "focus");
      } else {
        setRemaining(Math.max(0, Math.floor((end - now) / 1000)));
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, phase]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const primaryLabel = !running && !phaseEndAt ? "Start" : running ? "Pause" : "Resume";
  const onPrimary = () => (!running && !phaseEndAt ? onStart() : running ? onPause() : onResume());

  // Show splash screen first
  if (isLoading) {
    return <SplashScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <View style={[styles.container, phase === "focus" ? styles.focusBg : styles.breakBg]}>
      <Text style={styles.phase}>{phase === "focus" ? "FOCUS" : "BREAK"}</Text>
      <Text style={styles.time}>{mm}:{ss}</Text>

      <Pressable style={styles.primaryBtn} onPress={onPrimary}>
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </Pressable>

      <Pressable style={styles.stopBtn} onPress={onStop} disabled={!phaseEndAt}>
        <Text style={styles.stopText}>Stop</Text>
      </Pressable>

      {/* Session status - show for free users */}
      {!premiumStatus.isPremium && premiumStatus.dailySessionsLimit !== Infinity && (
        <View style={styles.premiumStatus}>
          <Text style={styles.freeText}>
            {premiumStatus.dailySessionsUsed}/{premiumStatus.dailySessionsLimit} sessions today
          </Text>
        </View>
      )}

      {/* Dev Fast Mode - hidden in production */}
      {__DEV__ && (
        <View style={styles.row}>
          <Text style={styles.devLabel}>Dev Fast Mode</Text>
          <Switch value={fast} onValueChange={setFast} />
        </View>
      )}

      <View style={styles.bottomContainer}>
        <Pressable onPress={() => setShowTipJar(true)}>
          <Text style={styles.supportLink}>Support this app</Text>
        </Pressable>
        <Text style={styles.tagline}>Radical simplicity — 25/5 on loop.</Text>
      </View>

      {/* Upgrade Modal */}
      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        trigger="session_limit"
      />

      {/* Tip Jar Modal */}
      <TipJarModal
        visible={showTipJar}
        onClose={() => setShowTipJar(false)}
        trigger={tipJarTrigger}
      />
    </View>
  );
}

// Wrap AppContent in PremiumProvider
export default function App() {
  return (
    <PremiumProvider>
      <AppContent />
    </PremiumProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  focusBg: { backgroundColor: "#1f2329" },
  breakBg: { backgroundColor: "#0f3d3e" },
  phase: { color: "rgba(255,255,255,0.85)", letterSpacing: 4, marginBottom: 12 },
  time: { color: "#fff", fontSize: 72, fontWeight: "200", letterSpacing: 2, marginBottom: 28 },
  primaryBtn: { backgroundColor: "#fff", paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14, marginBottom: 10 },
  primaryText: { color: "#111", fontSize: 18, fontWeight: "700" },
  stopBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", marginBottom: 26 },
  stopText: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  devLabel: { color: "rgba(255,255,255,0.8)", marginRight: 8 },
  premiumStatus: { marginTop: 20, alignItems: "center" },
  premiumText: { color: "#4CAF50", fontSize: 16, fontWeight: "600" },
  freeText: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "500" },
  bottomContainer: { position: "absolute", bottom: 20, alignItems: "center" },
  supportLink: { color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 8 },
  tagline: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  // Modal styles
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "center", alignItems: "center", padding: 20 },
  modal: { backgroundColor: "#1a1a1a", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#ffffff", textAlign: "center", marginBottom: 8 },
  message: { fontSize: 16, color: "#cccccc", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  features: { width: "100%", marginBottom: 24 },
  featuresTitle: { fontSize: 18, fontWeight: "600", color: "#ffffff", marginBottom: 12, textAlign: "center" },
  feature: { fontSize: 16, color: "#cccccc", marginBottom: 8, paddingLeft: 8 },
  pricing: { alignItems: "center", marginBottom: 24 },
  price: { fontSize: 32, fontWeight: "bold", color: "#4CAF50", marginBottom: 4 },
  priceSubtext: { fontSize: 14, color: "#999999" },
  purchaseButton: { backgroundColor: "#4CAF50", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: "100%", alignItems: "center", marginBottom: 12 },
  purchaseButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "600" },
  closeButton: { paddingVertical: 8 },
  closeButtonText: { color: "#999999", fontSize: 16 },
});
