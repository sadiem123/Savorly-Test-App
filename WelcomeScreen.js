import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const bubbles = Array.from({ length: 8 }).map(() => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    size: 80 + Math.random() * 100,
    delay: Math.random() * 3000,
    speed: 8000 + Math.random() * 6000,
  }));

  useEffect(() => {
    bubbles.forEach(bubble => {
      const animate = () => {
        bubble.x.setValue(Math.random() * width);
        bubble.y.setValue(height + 200);

        Animated.parallel([
          Animated.timing(bubble.y, {
            toValue: -200,
            duration: bubble.speed,
            delay: bubble.delay,
            useNativeDriver: true,
          }),
          Animated.timing(bubble.x, {
            toValue: Math.random() * width,
            duration: bubble.speed * 1.1,
            useNativeDriver: true,
          }),
        ]).start(() => animate());
      };
      animate();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated Bubbles */}
      {bubbles.map((bubble, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bubble,
            {
              width: bubble.size,
              height: bubble.size,
              borderRadius: bubble.size / 2,
              transform: [{ translateX: bubble.x }, { translateY: bubble.y }],
            },
          ]}
        />
      ))}

      <View style={styles.overlay}>
        <Text style={styles.title}>Welcome to Savorly!</Text>
        <Text style={styles.subtitle}>Sign in as...</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('StudentHome')}
        >
          <Text style={styles.buttonText}>Student</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonAlt}
          onPress={() => navigation.navigate('RestaurantHome')}
        >
          <Text style={styles.buttonText}>Restaurant</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonAlt2}
          onPress={() => navigation.navigate('OrgHome')}
        >
          <Text style={styles.buttonText}>Campus Organization</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const lightGreen = '#d6f5d6';
const gold = '#e8c75d';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightGreen,
  },
  overlay: {
    position: 'absolute',
    top: '20%',
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2a4d2a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 22,
    marginBottom: 40,
    color: '#4d4d4d',
  },
  button: {
    backgroundColor: gold,
    width: '70%',
    padding: 16,
    marginBottom: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonAlt: {
    backgroundColor: '#f2daa6',
    width: '70%',
    padding: 16,
    marginBottom: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonAlt2: {
    backgroundColor: '#eed29b',
    width: '70%',
    padding: 16,
    marginBottom: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b3b3b',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
});