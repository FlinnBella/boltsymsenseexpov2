import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Video as LucideIcon } from 'lucide-react-native';

interface HealthCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: typeof LucideIcon;
  color: string;
  progress?: number;
  onPress?: () => void;
  delay?: number;
}

export default function HealthCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  progress,
  onPress,
  delay = 0,
}: HealthCardProps) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(600)}>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: color }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <Icon color="white" size={24} />
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.value}>
            {value}
            {unit ? <Text style={styles.unit}> {unit}</Text> : null}
          </Text>
          
          {progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(progress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    padding: 20,
    minHeight: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  value: {
    color: 'white',
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    lineHeight: 38,
  },
  unit: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    opacity: 0.8,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
    opacity: 0.9,
  },
});