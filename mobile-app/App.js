import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch, AppState } from "react-native";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [phase, setPhase] = useState("focus");      // "focus" | "break"
  const [running, setRunning] = useState(false);
  const [fast, setFast] = useState(true);           // dev fast mode ON
  const [phaseEndAt, setPhaseEndAt] = useState(null); // epoch ms
  const [notificationId, setNotificationId] = useState(null); // current scheduled notification
  const tickRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // audio
  const soundRef = useRef(null);

  const durations = useMemo(() => (fast ? DUR_DEV : DUR), [fast]);

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { phase: storedPhase, phaseStartAt, phaseEndAt: storedEndAt } = JSON.parse(stored);
          const now = Date.now();
<<<<<<< HEAD
          
=======

>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
          if (storedEndAt && now < storedEndAt) {
            setPhase(storedPhase);
            setPhaseEndAt(storedEndAt);
            setRunning(true);
          } else if (storedEndAt && now >= storedEndAt) {
            const elapsed = now - storedEndAt;
            const phaseDuration = storedPhase === "focus" ? durations.break : durations.focus;
            const newPhase = storedPhase === "focus" ? "break" : "focus";
<<<<<<< HEAD
            
=======

>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
            if (elapsed < phaseDuration * 1000) {
              setPhase(newPhase);
              setPhaseEndAt(storedEndAt + phaseDuration * 1000);
              setRunning(true);
            } else {
              setPhase("focus");
              setPhaseEndAt(null);
              setRunning(false);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load state:", e);
      }
    };

    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
<<<<<<< HEAD
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
=======
      if (status !== "granted") {
        console.warn("Notification permissions not granted");
>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
      }
    };

    loadState();
    requestNotificationPermissions();
  }, [durations]);

  // prepare audio (play in iOS silent mode)
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          require("./assets/chime.mp3")
        );
        soundRef.current = sound;
      } catch (e) {
        console.warn("Chime not loaded. Add assets/chime.mp3", e?.message);
      }
    })();
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
<<<<<<< HEAD
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (phaseEndAt) {
          setPhaseEndAt(prev => prev);
=======
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        if (phaseEndAt) {
          setPhaseEndAt((prev) => prev); // force a re-render to recalc remaining
>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
        }
      }
      appState.current = nextAppState;
    };

<<<<<<< HEAD
    const subscription = AppState.addEventListener('change', handleAppStateChange);
=======
    const subscription = AppState.addEventListener("change", handleAppStateChange);
>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
    return () => subscription?.remove();
  }, [phaseEndAt]);

  const playChime = async () => {
    try {
      const s = soundRef.current;
      if (!s) return;
      await s.replayAsync();
    } catch {}
  };

  const triggerHaptic = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const saveState = async (newPhase, newPhaseEndAt) => {
    try {
      const state = {
        phase: newPhase,
        phaseStartAt: Date.now(),
        phaseEndAt: newPhaseEndAt,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
  };

  const clearState = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear state:", e);
    }
  };

  const cancelNotification = async () => {
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        setNotificationId(null);
      } catch (e) {
        console.warn("Failed to cancel notification:", e);
      }
    }
  };

  const scheduleNotification = async (endTime, nextPhase) => {
    try {
      await cancelNotification(); // Cancel any existing notification
<<<<<<< HEAD
      
=======

>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
      const trigger = new Date(endTime);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: nextPhase === "focus" ? "Break time!" : "Focus time!",
          body: nextPhase === "focus" ? "Time for a break" : "Time to focus",
          sound: true,
        },
        trigger,
      });
<<<<<<< HEAD
      
=======

>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
      setNotificationId(id);
    } catch (e) {
      console.warn("Failed to schedule notification:", e);
    }
  };

  // compute remaining seconds from timestamps (survives background)
  const remaining = Math.max(0, phaseEndAt ? Math.floor((phaseEndAt - Date.now()) / 1000) : 0);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // start the given phase
  const startPhase = async (next) => {
    const seconds = next === "focus" ? durations.focus : durations.break;
    const endTime = Date.now() + seconds * 1000;
<<<<<<< HEAD
    
    setPhase(next);
    setPhaseEndAt(endTime);
    setRunning(true);
    
=======

    setPhase(next);
    setPhaseEndAt(endTime);
    setRunning(true);

>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
    await saveState(next, endTime);
    const nextPhase = next === "focus" ? "break" : "focus";
    await scheduleNotification(endTime, nextPhase);
  };

  // ticking & auto-flip phase
  useEffect(() => {
    if (!running) return;
    clearInterval(tickRef.current);
    tickRef.current = setInterval(async () => {
      if (!phaseEndAt) return;
      if (Date.now() >= phaseEndAt) {
        await playChime();
        await triggerHaptic();
        await startPhase(phase === "focus" ? "break" : "focus");
      } else {
        // trigger re-render cheaply
        setPhaseEndAt((x) => x);
      }
    }, 200);
    return () => clearInterval(tickRef.current);
  }, [running, phaseEndAt, phase, durations]);

  // controls
  const onStart = () => startPhase("focus");
<<<<<<< HEAD
  
=======

>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
  const onPause = async () => {
    setRunning(false);
    await cancelNotification();
  };
<<<<<<< HEAD
  
=======

>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
  const onResume = async () => {
    if (!phaseEndAt) return;
    const remain = Math.max(0, phaseEndAt - Date.now());
    const newEndTime = Date.now() + remain;
<<<<<<< HEAD
    
    setPhaseEndAt(newEndTime);
    setRunning(true);
    
=======

    setPhaseEndAt(newEndTime);
    setRunning(true);

>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
    await saveState(phase, newEndTime);
    const nextPhase = phase === "focus" ? "break" : "focus";
    await scheduleNotification(newEndTime, nextPhase);
  };
<<<<<<< HEAD
  
=======

>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
  const onStop = async () => {
    setRunning(false);
    setPhase("focus");
    setPhaseEndAt(null);
<<<<<<< HEAD
    
=======

>>>>>>> 63c1540 (merge: keep monolithic App.js + add persistence/notifications/haptics)
    await cancelNotification();
    await clearState();
  };

  const primaryLabel = !running && !phaseEndAt ? "Start" : running ? "Pause" : "Resume";
  const onPrimary = () => {
    if (!running && !phaseEndAt) return onStart();
    if (running) return onPause();
    return onResume();
  };

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
