import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch } from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

// Real vs dev durations
const DUR = { focus: 25 * 60, break: 5 * 60 };
const DUR_DEV = { focus: 25, break: 5 }; // fast mode for QA

const STORAGE_KEY = 'pomodoroflow_state';

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
  const tickRef = useRef(null);
  const notificationId = useRef(null);

  // audio
  const soundRef = useRef(null);

  const durations = useMemo(() => (fast ? DUR_DEV : DUR), [fast]);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { phase: storedPhase, phaseStartAt, phaseEndAt: storedPhaseEndAt } = JSON.parse(stored);
          const now = Date.now();
          
          if (storedPhaseEndAt && now < storedPhaseEndAt) {
            setPhase(storedPhase);
            setPhaseEndAt(storedPhaseEndAt);
            setRunning(true);
          } else if (storedPhaseEndAt && now >= storedPhaseEndAt) {
            const nextPhase = storedPhase === "focus" ? "break" : "focus";
            setPhase(nextPhase);
            setPhaseEndAt(null);
            setRunning(false);
          }
        }
      } catch (e) {
        console.warn('Failed to load state:', e);
      }
    };
    loadState();
  }, []);

  const saveState = async (currentPhase, currentPhaseEndAt) => {
    try {
      const state = {
        phase: currentPhase,
        phaseStartAt: Date.now(),
        phaseEndAt: currentPhaseEndAt,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  };

  const clearState = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear state:', e);
    }
  };

  const scheduleNotification = async (endTime, nextPhase) => {
    try {
      await cancelNotification();
      
      const trigger = new Date(endTime);
      const title = nextPhase === 'focus' ? 'Focus time!' : 'Break time!';
      const body = nextPhase === 'focus' ? 'Time to focus' : 'Time for a break';
      
      notificationId.current = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger,
      });
    } catch (e) {
      console.warn('Failed to schedule notification:', e);
    }
  };

  const cancelNotification = async () => {
    if (notificationId.current) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId.current);
        notificationId.current = null;
      } catch (e) {
        console.warn('Failed to cancel notification:', e);
      }
    }
  };

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
    } catch (e) {
      console.warn('Failed to trigger haptic:', e);
    }
  };

  // compute remaining seconds from timestamps (survives background)
  const remaining = Math.max(
    0,
    phaseEndAt ? Math.floor((phaseEndAt - Date.now()) / 1000) : 0
  );
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // start the given phase
  const startPhase = (next) => {
    const seconds = next === "focus" ? durations.focus : durations.break;
    const endTime = Date.now() + seconds * 1000;
    setPhase(next);
    setPhaseEndAt(endTime);
    setRunning(true);
    
    saveState(next, endTime);
    const nextPhase = next === "focus" ? "break" : "focus";
    scheduleNotification(endTime, nextPhase);
  };

  // ticking & auto-flip phase
  useEffect(() => {
    if (!running) return;
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (!phaseEndAt) return;
      if (Date.now() >= phaseEndAt) {
        playChime(); // ding at transition
        triggerHaptic(); // haptic feedback
        startPhase(phase === "focus" ? "break" : "focus");
      } else {
        // trigger re-render cheaply
        setPhaseEndAt((x) => x);
      }
    }, 200);
    return () => clearInterval(tickRef.current);
  }, [running, phaseEndAt, phase, durations]);

  // controls
  const onStart = () => startPhase("focus");
  const onPause = () => {
    setRunning(false);
    cancelNotification();
  };
  const onResume = () => {
    if (!phaseEndAt) return;
    const remain = Math.max(0, phaseEndAt - Date.now());
    const newEndTime = Date.now() + remain;
    setPhaseEndAt(newEndTime);
    setRunning(true);
    
    saveState(phase, newEndTime);
    const nextPhase = phase === "focus" ? "break" : "focus";
    scheduleNotification(newEndTime, nextPhase);
  };
  const onStop = () => {
    setRunning(false);
    setPhase("focus");
    setPhaseEndAt(null);
    cancelNotification();
    clearState();
  };

  const primaryLabel =
    !running && !phaseEndAt ? "Start" : running ? "Pause" : "Resume";
  const onPrimary = () => {
    if (!running && !phaseEndAt) return onStart();
    if (running) return onPause();
    return onResume();
  };

  return (
    <View
      style={[
        styles.container,
        phase === "focus" ? styles.focusBg : styles.breakBg,
      ]}
    >
      <Text style={styles.phase}>{phase === "focus" ? "FOCUS" : "BREAK"}</Text>
      <Text style={styles.time}>
        {mm}:{ss}
      </Text>

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
