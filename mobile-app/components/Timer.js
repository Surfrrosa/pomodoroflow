import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Timer = ({ currentTime, sessionType, isBreak }) => {
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Text style={[styles.time, isBreak && styles.timeBreak]}>{timeString}</Text>
      <Text style={[styles.sessionType, isBreak && styles.sessionTypeBreak]}>{sessionType}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 48,
  },
  time: {
    fontSize: 64,
    fontWeight: '300',
    color: 'white',
    letterSpacing: 2,
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  timeBreak: {
    color: 'white',
  },
  sessionType: {
    fontSize: 19,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 3,
  },
  sessionTypeBreak: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default Timer;
