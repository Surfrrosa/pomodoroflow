import React from 'react';
import { View, StyleSheet } from 'react-native';

export const SessionIndicator = ({ currentSession, isBreak, maxSessions = 4 }) => {
  const dots = Array.from({ length: maxSessions }, (_, index) => {
    const isActive = index < currentSession && !isBreak;
    const isCurrent = index === currentSession - 1 && !isBreak;
    
    return (
      <View
        key={index}
        style={[
          styles.dot,
          (isActive || isCurrent) && styles.dotActive
        ]}
      />
    );
  });

  return (
    <View style={styles.container}>
      {dots}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: 'white',
    shadowColor: 'rgba(255, 255, 255, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default SessionIndicator;
