import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeOutDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat 
} from 'react-native-reanimated';
import { useThemeColors } from '@/stores/useThemeStore';

interface LoadingScreenProps {
  visible: boolean;
}

export default function LoadingScreen({ visible }: LoadingScreenProps) {
  const progress = useSharedValue(0);
  const colors = useThemeColors();

  useEffect(() => {
    if (visible) {
      progress.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        false
      );
    }
  }, [visible]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, '#10B981']} style={styles.gradient}>
        <Animated.View 
          entering={FadeInDown.duration(600)} 
          exiting={FadeOutDown.duration(400)}
          style={styles.content}
        >
          <Text style={styles.loadingText}>Loading</Text>
          
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>
          
          <Text style={styles.subtitle}>Setting up your health dashboard...</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 24,
  },
  progressContainer: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
});