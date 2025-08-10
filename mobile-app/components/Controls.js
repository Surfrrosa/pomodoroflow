import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Switch } from 'react-native';

export const Controls = ({ 
  isRunning, 
  onToggleTimer, 
  onStopTimer, 
  devFastMode, 
  onToggleDevMode,
  hasStarted 
}) => {
  const getButtonText = () => {
    if (!hasStarted) return 'START';
    return isRunning ? 'PAUSE' : 'RESUME';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonRunning]}
        onPress={onToggleTimer}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>
      
      {hasStarted && (
        <TouchableOpacity
          style={styles.stopButton}
          onPress={onStopTimer}
          activeOpacity={0.8}
        >
          <Text style={styles.stopButtonText}>STOP</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.devModeContainer}>
        <Text style={styles.devModeLabel}>Dev Fast Mode</Text>
        <Switch
          value={devFastMode}
          onValueChange={onToggleDevMode}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.4)' }}
          thumbColor={devFastMode ? 'white' : 'rgba(255,255,255,0.6)'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
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
  stopButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  devModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  devModeLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '400',
  },
});

export default Controls;
