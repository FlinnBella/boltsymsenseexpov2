import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Simulate network status checking
    const checkConnection = () => {
      // In a real app, you'd use NetInfo or similar
      setIsOnline(AppState.currentState === 'active');
    };

    checkConnection();
    const subscription = AppState.addEventListener('change', checkConnection);

    return () => {
      subscription.remove();
    };
  }, []);

  if (isOnline) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutDown.duration(300)}
      style={styles.container}
    >
      <WifiOff color="white" size={20} />
      <Text style={styles.text}>No internet connection</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Retry</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
    marginRight: 16,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});