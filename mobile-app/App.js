import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { keepAwake, activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

import Timer from './components/Timer';
import SessionIndicator from './components/SessionIndicator';
import Controls from './components/Controls';
import PomodoroTimerService from './services/TimerService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const timerService = new PomodoroTimerService();

export default function App() {
  const [timerState, setTimerState] = useState({
    currentTime: 25 * 60,
    isRunning: false,
    isBreak: false,
    currentSession: 1,
    sessionType: 'FOCUS',
    devFastMode: true
  });

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    };
    
    requestPermissions();

    const handleTimerUpdate = (state) => {
      setTimerState(state);
    };

    timerService.addListener(handleTimerUpdate);

    return () => {
      timerService.removeListener(handleTimerUpdate);
    };
  }, []);

  useEffect(() => {
    if (timerState.isRunning) {
      activateKeepAwake();
    } else {
      deactivateKeepAwake();
    }

    return () => {
      deactivateKeepAwake();
    };
  }, [timerState.isRunning]);

  const handleToggleTimer = () => {
    timerService.toggleTimer();
  };

  const handleStopTimer = () => {
    timerService.stopTimer();
  };

  const handleToggleDevMode = () => {
    timerService.toggleDevFastMode();
  };

  const hasStarted = timerState.isRunning || timerState.currentTime !== (timerState.devFastMode ? 25 : 25 * 60);

  const gradientColors = timerState.isBreak 
    ? ['#4facfe', '#00f2fe'] // Blue gradient for break
    : ['#667eea', '#764ba2']; // Purple gradient for focus

  return (
    <ExpoLinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        <Timer 
          currentTime={timerState.currentTime}
          sessionType={timerState.sessionType}
          isBreak={timerState.isBreak}
        />
        
        <View style={styles.sessionInfo}>
          <SessionIndicator 
            currentSession={timerState.currentSession}
            isBreak={timerState.isBreak}
            maxSessions={4}
          />
        </View>
        
        <Controls 
          isRunning={timerState.isRunning}
          onToggleTimer={handleToggleTimer}
          onStopTimer={handleStopTimer}
          devFastMode={timerState.devFastMode}
          onToggleDevMode={handleToggleDevMode}
          hasStarted={hasStarted}
        />
      </View>
      
      <StatusBar style="light" />
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  sessionInfo: {
    alignItems: 'center',
    marginBottom: 48,
  },
});
