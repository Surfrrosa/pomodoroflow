import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export const Controls = ({ isRunning, onToggleTimer }) => {
  return (
    <TouchableOpacity
      style={[styles.button, isRunning && styles.buttonRunning]}
      onPress={onToggleTimer}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>
        {isRunning ? 'PAUSE' : 'START'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonRunning: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: 'white',
    fontSize: 19,
    fontWeight: '500',
    letterSpacing: 2,
  },
});

export default Controls;
