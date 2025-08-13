// mobile-app/App.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch, AppState, Platform } from "react-native";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const NOTIFS_ENABLED = process.env.NOTIFS_ENABLED !== 'false';

// Real vs dev durations
const DUR = { focus: 25 * 60, break: 5 * 60 };
const DUR_DEV = { focus: 25, break: 5 }; // fast mode for QA

const STORAGE_KEY = "pomodoroflow_state";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [phase, setPhase] = useState("focus");            // "focus" | "break"
  const [running, setRunning] = useState(false);
  const [fast, setFast] = useState(Constants.executionEnvironment === "storeClient" ? false : true);
  const [phaseEndAt, setPhaseEndAt] = useState(null);     // epoch ms
  const [remaining, setRemaining] = useState(0);          // seconds left for display
  const durations = useMemo(() => (fast ? DUR_DEV : DUR), [fast]);

  const endAtRef = useRef(null);           // read by interval without re-rendering
  const notificationIdRef = useRef(null);  // currently scheduled local notif id
  const lastScheduleKeyRef = useRef(null); // prevent duplicate scheduling
  const appState = useRef(AppState.currentState);
  const soundRef = useRef(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[NOTIF] Starting app cleanup...');
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.dismissAllNotificationsAsync();
        const remaining = await Notifications.getAllScheduledNotificationsAsync();
        console.log('[NOTIF] Scheduled after cleanup:', remaining);

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFFFFF',
          });
          console.log('[NOTIF] Android channel configured');
        }

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") console.warn("Notification permissions not granted");
        console.log('[NOTIF] Permissions status:', status);
      } catch (e) {
        console.warn("Failed to initialize notifications:", e);
      }
    };

    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
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
        console.warn("Failed to load state:", e);
      }
    };

    initializeApp();
    loadState();
  }, [durations]);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(require("./assets/chime.mp3"));
        soundRef.current = sound;
      } catch (e) {
        console.warn("Chime not loaded. Add assets/chime.mp3", e?.message);
      }
    })();
    return () => soundRef.current?.unloadAsync();
  }, []);

  useEffect(() => {
    console.log('[NOTIF] Registering notification listeners');
    
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('[NOTIF] Notification received:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[NOTIF] Notification response:', response);
    });

    return () => {
      console.log('[NOTIF] Cleaning up notification listeners');
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
        console.log('[NOTIF] Cancelled notification:', notificationIdRef.current);
      } catch (e) {
        console.warn('[NOTIF] Failed to cancel notification:', e);
      }
      notificationIdRef.current = null;
    }
  };

  const scheduleOnce = async ({ title, body, endTime, label }) => {
    if (!NOTIFS_ENABLED) return null;
    
    const key = `${label}-${new Date(endTime).getTime()}`;
    
    if (lastScheduleKeyRef.current === key) {
      console.log('[NOTIF] Skipping duplicate schedule:', key);
      return null;
    }
    
    await cancelNotification(); // prevent stacking
    
    try {
      console.log('[NOTIF] Scheduling notification:', { key, endTime, title });
      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: { type: 'date', date: new Date(endTime) },
      });
      
      notificationIdRef.current = id;
      lastScheduleKeyRef.current = key;
      console.log('[NOTIF] Notification scheduled successfully:', id);
      return id;
    } catch (e) {
      console.warn('[NOTIF] Failed to schedule notification:', e);
      return null;
    }
  };

  const schedulePhaseNotification = async (endTime, nextPhase) => {
    const title = nextPhase === "focus" ? "Break time!" : "Focus time!";
    const body = nextPhase === "focus" ? "Time for a break" : "Time to focus";
    return scheduleOnce({ title, body, endTime, label: nextPhase });
  };

  const saveState = async (p, end) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ phase: p, phaseStartAt: Date.now(), phaseEndAt: end })); }
    catch (e) { console.warn("Failed to save state:", e); }
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
  };

  const onStart  = () => startPhase("focus");
  const onPause  = async () => { setRunning(false); await cancelNotification(); };
  const onStop   = async () => { setRunning(false); setPhase("focus"); setPhaseEndAt(null); setRemaining(0); await cancelNotification(); await AsyncStorage.removeItem(STORAGE_KEY); };
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

      <View style={styles.row}>
        <Text style={styles.devLabel}>Dev Fast Mode</Text>
        <Switch value={fast} onValueChange={setFast} />
      </View>

      <Text style={styles.tagline}>Radical simplicity — 25/5 on loop.</Text>
    </View>
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
  tagline: { position: "absolute", bottom: 28, color: "rgba(255,255,255,0.5)" },
});
