import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ConfettiOverlay = ({ visible, onComplete }) => {
  const [particles] = useState(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      animatedValue: new Animated.Value(0),
      x: Math.random() * screenWidth,
      rotation: new Animated.Value(0),
    }))
  );

  useEffect(() => {
    if (visible) {
      const animations = particles.map(particle => {
        return Animated.parallel([
          Animated.timing(particle.animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotation, {
            toValue: 360,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(animations).start(() => {
        particles.forEach(particle => {
          particle.animatedValue.setValue(0);
          particle.rotation.setValue(0);
        });
        onComplete?.();
      });
    }
  }, [visible, particles, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map(particle => {
        const translateY = particle.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, screenHeight * 0.8],
        });

        const opacity = particle.animatedValue.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0, 1, 1, 0],
        });

        const rotateZ = particle.rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                transform: [
                  { translateY },
                  { rotateZ },
                ],
                opacity,
              },
            ]}
          >
            <Text style={styles.emoji}>🍅</Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    top: -50,
  },
  emoji: {
    fontSize: 24,
  },
});

export default ConfettiOverlay;
