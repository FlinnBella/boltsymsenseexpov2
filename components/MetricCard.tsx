import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Video as LucideIcon } from 'lucide-react-native';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: typeof LucideIcon;
  color: string;
  change?: number;
  onPress?: () => void;
  delay?: number;
}

export default function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  change,
  onPress,
  delay = 0,
}: MetricCardProps) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(600)}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <Icon color="white" size={20} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <Text style={styles.value}>
          {value}
          {unit ? <Text style={styles.unit}> {unit}</Text> : null}
        </Text>
        
        {change !== undefined ? (
          <Text style={[
            styles.change,
            { color: change >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {change >= 0 ? '+' : ''}{change}%
          </Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  value: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  unit: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  change: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});