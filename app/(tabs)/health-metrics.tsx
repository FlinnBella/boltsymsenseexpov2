import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Footprints, Flame, Heart, TrendingUp } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/stores/useUserStore';

const { width } = Dimensions.get('window');

interface BiometricData {
  date: string;
  steps: number;
  calories_burned: number;
  heart_rate_avg: number;
}

export default function HealthMetricsScreen() {
  const userProfile = useUserProfile();
  const [weeklyData, setWeeklyData] = useState<BiometricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'steps' | 'calories' | 'heart_rate'>('steps');

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      const { data, error } = await supabase
        .from('user_biometric_data')
        .select('date, steps, calories_burned, heart_rate_avg')
        .eq('user_id', userProfile?.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading weekly data:', error);
        return;
      }

      // Fill in missing days with zero values
      const filledData: BiometricData[] = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        const existingData = data?.find(d => d.date === dateString);
        filledData.push({
          date: dateString,
          steps: existingData?.steps || 0,
          calories_burned: existingData?.calories_burned || 0,
          heart_rate_avg: existingData?.heart_rate_avg || 0,
        });
      }

      setWeeklyData(filledData);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricValue = (data: BiometricData, metric: string) => {
    switch (metric) {
      case 'steps':
        return data.steps;
      case 'calories':
        return data.calories_burned;
      case 'heart_rate':
        return data.heart_rate_avg;
      default:
        return 0;
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'steps':
        return '#3B82F6';
      case 'calories':
        return '#F97316';
      case 'heart_rate':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'steps':
        return Footprints;
      case 'calories':
        return Flame;
      case 'heart_rate':
        return Heart;
      default:
        return TrendingUp;
    }
  };

  const getMetricUnit = (metric: string) => {
    switch (metric) {
      case 'steps':
        return 'steps';
      case 'calories':
        return 'kcal';
      case 'heart_rate':
        return 'bpm';
      default:
        return '';
    }
  };

  const renderChart = () => {
    if (weeklyData.length === 0) return null;

    const maxValue = Math.max(...weeklyData.map(d => getMetricValue(d, selectedMetric)));
    const chartHeight = 200;
    const barWidth = (width - 80) / 7;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {weeklyData.map((data, index) => {
            const value = getMetricValue(data, selectedMetric);
            const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
            const date = new Date(data.date);
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });

            return (
              <View key={index} style={styles.barContainer}>
                <View style={[styles.bar, { height: barHeight, backgroundColor: getMetricColor(selectedMetric) }]} />
                <Text style={styles.barValue}>{value}</Text>
                <Text style={styles.barLabel}>{dayName}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const calculateAverage = () => {
    if (weeklyData.length === 0) return 0;
    const total = weeklyData.reduce((sum, data) => sum + getMetricValue(data, selectedMetric), 0);
    return Math.round(total / weeklyData.length);
  };

  const calculateTrend = () => {
    if (weeklyData.length < 2) return 0;
    const firstHalf = weeklyData.slice(0, 3);
    const secondHalf = weeklyData.slice(4, 7);
    
    const firstAvg = firstHalf.reduce((sum, data) => sum + getMetricValue(data, selectedMetric), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, data) => sum + getMetricValue(data, selectedMetric), 0) / secondHalf.length;
    
    return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Health Metrics</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInRight.delay(200).duration(600)} style={styles.metricsSelector}>
          {['steps', 'calories', 'heart_rate'].map((metric) => {
            const Icon = getMetricIcon(metric);
            const isSelected = selectedMetric === metric;
            
            return (
              <TouchableOpacity
                key={metric}
                style={[
                  styles.metricButton,
                  { backgroundColor: isSelected ? getMetricColor(metric) : '#F3F4F6' }
                ]}
                onPress={() => setSelectedMetric(metric as any)}
              >
                <Icon color={isSelected ? 'white' : '#6B7280'} size={20} />
                <Text
                  style={[
                    styles.metricButtonText,
                    { color: isSelected ? 'white' : '#6B7280' }
                  ]}
                >
                  {metric === 'heart_rate' ? 'Heart Rate' : metric.charAt(0).toUpperCase() + metric.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(400).duration(600)} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{calculateAverage()}</Text>
            <Text style={styles.statLabel}>7-Day Average</Text>
            <Text style={styles.statUnit}>{getMetricUnit(selectedMetric)}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[
              styles.statValue,
              { color: calculateTrend() >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {calculateTrend() >= 0 ? '+' : ''}{calculateTrend()}%
            </Text>
            <Text style={styles.statLabel}>Weekly Trend</Text>
            <Text style={styles.statUnit}>vs last week</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(600).duration(600)} style={styles.chartSection}>
          <Text style={styles.chartTitle}>7-Day Overview</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          ) : (
            renderChart()
          )}
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(800).duration(600)} style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>💡 Health Insights</Text>
          <View style={styles.insightsList}>
            {selectedMetric === 'steps' && (
              <>
                <Text style={styles.insightItem}>• Aim for 10,000 steps daily for optimal health</Text>
                <Text style={styles.insightItem}>• Take short walks throughout the day</Text>
                <Text style={styles.insightItem}>• Use stairs instead of elevators when possible</Text>
              </>
            )}
            {selectedMetric === 'calories' && (
              <>
                <Text style={styles.insightItem}>• Consistent calorie burn indicates good activity levels</Text>
                <Text style={styles.insightItem}>• Combine cardio and strength training</Text>
                <Text style={styles.insightItem}>• Stay hydrated during exercise</Text>
              </>
            )}
            {selectedMetric === 'heart_rate' && (
              <>
                <Text style={styles.insightItem}>• Lower resting heart rate indicates better fitness</Text>
                <Text style={styles.insightItem}>• Monitor for unusual patterns or spikes</Text>
                <Text style={styles.insightItem}>• Consult your doctor about concerning changes</Text>
              </>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    marginBottom: 24,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  metricsSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  metricButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  chartSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 20,
  },
  chartContainer: {
    height: 280,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    marginBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  barValue: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  insightsSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  insightsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
    marginBottom: 12,
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1E40AF',
    lineHeight: 20,
  },
});