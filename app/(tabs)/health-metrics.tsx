import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Footprints, Flame, Heart, TrendingUp, Bell, Activity, Target } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore, useUserProfile, useHealthData, useUserPreferences, useIsLoadingHealthData } from '@/stores/useUserStore';
import { useThemeColors } from '@/stores/useThemeStore';
import HealthCard from '@/components/HealthCard';
import MetricCard from '@/components/MetricCard';
import CircularProgress from '@/components/CircularProgress';

const { width } = Dimensions.get('window');

interface BiometricData {
  date: string;
  steps: number;
  calories_burned: number;
  heart_rate_avg: number;
}

export default function HealthMetricsScreen() {
  const userProfile = useUserProfile();
  const healthData = useHealthData();
  const preferences = useUserPreferences();
  const isLoadingHealthData = useIsLoadingHealthData();
  const { fetchHealthData } = useUserStore();
  const colors = useThemeColors();
  
  const [weeklyData, setWeeklyData] = useState<BiometricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchHealthData(),
        loadWeeklyData(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
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

  const calculateProgress = (current: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.round((current / goal) * 100);
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
                <Text style={[styles.barValue, { color: colors.text }]}>{value}</Text>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{dayName}</Text>
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

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Health Metrics</Text>
            <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.surface }]}>
              <Bell color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Welcome Section */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.welcomeSection}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good Morning</Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {userProfile?.first_name ? capitalizeFirstLetter(userProfile.first_name) : 'User'}
          </Text>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.summaryText}>You're doing great!</Text>
            <Text style={styles.summarySubtext}>
              You've completed {Math.round((calculateProgress(healthData.steps, healthData.HealthGoals.steps) + calculateProgress(healthData.calories, healthData.HealthGoals.calories)) / 2)}% of your daily goals
            </Text>
          </View>
        </Animated.View>

        {/* Today's Progress Cards */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Progress</Text>
          <View style={styles.cardGrid}>
            <View style={styles.cardRow}>
              <View style={styles.cardHalf}>
                <HealthCard
                  title="Steps"
                  value={healthData.steps.toLocaleString()}
                  icon={Footprints}
                  color="#3B82F6"
                  progress={calculateProgress(healthData.steps, healthData.HealthGoals.steps)}
                />
              </View>
              <View style={styles.cardHalf}>
                <HealthCard
                  title="Calories"
                  value={healthData.calories}
                  unit="kcal"
                  icon={Flame}
                  color="#F97316"
                  progress={calculateProgress(healthData.calories, healthData.HealthGoals.calories)}
                />
              </View>
            </View>

            <View style={styles.cardRow}>
              <View style={styles.cardFull}>
                <View style={styles.heartRateCard}>
                  <View style={[styles.heartRateGradient, { backgroundColor: '#EF4444' }]}>
                    <View style={styles.heartRateHeader}>
                      <Heart color="white" size={24} />
                      <Text style={styles.heartRateTitle}>Heart Rate</Text>
                    </View>
                    
                    <View style={styles.heartRateContent}>
                      <CircularProgress
                        size={120}
                        strokeWidth={8}
                        progress={75}
                        color="white"
                        backgroundColor="rgba(255, 255, 255, 0.3)"
                      >
                        <Text style={styles.heartRateValue}>
                          {healthData.heartRate || '--'}
                        </Text>
                        <Text style={styles.heartRateUnit}>BPM</Text>
                      </CircularProgress>
                      
                      <View style={styles.heartRateStats}>
                        <View style={styles.heartRateStat}>
                          <Text style={styles.heartRateStatValue}>--</Text>
                          <Text style={styles.heartRateStatLabel}>Resting</Text>
                        </View>
                        <View style={styles.heartRateStat}>
                          <Text style={styles.heartRateStatValue}>--</Text>
                          <Text style={styles.heartRateStatLabel}>Max Today</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Health Goals */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Goals</Text>
          <View style={styles.goalsGrid}>
            <View style={[styles.goalCard, { backgroundColor: colors.background }]}>
              <Target color={colors.primary} size={20} />
              <Text style={[styles.goalTitle, { color: colors.text }]}>Daily Steps</Text>
              <Text style={[styles.goalValue, { color: colors.textSecondary }]}>{healthData.HealthGoals.steps.toLocaleString()} steps</Text>
            </View>
            <View style={[styles.goalCard, { backgroundColor: colors.background }]}>
              <Heart color={colors.primary} size={20} />
              <Text style={[styles.goalTitle, { color: colors.text }]}>Calories Goal</Text>
              <Text style={[styles.goalValue, { color: colors.textSecondary }]}>{healthData.HealthGoals.calories} kcal</Text>
            </View>
            <View style={[styles.goalCard, { backgroundColor: colors.background }]}>
              <Activity color={colors.primary} size={20} />
              <Text style={[styles.goalTitle, { color: colors.text }]}>Active Minutes</Text>
              <Text style={[styles.goalValue, { color: colors.textSecondary }]}>{healthData.HealthGoals.activeMinutes} minutes</Text>
            </View>
          </View>
        </Animated.View>

        {/* Metric Selector */}
        <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Analysis</Text>
          <View style={styles.metricsSelector}>
            {['steps', 'calories', 'heart_rate'].map((metric) => {
              const Icon = getMetricIcon(metric);
              const isSelected = selectedMetric === metric;
              
              return (
                <TouchableOpacity
                  key={metric}
                  style={[
                    styles.metricButton,
                    { backgroundColor: isSelected ? getMetricColor(metric) : colors.surface }
                  ]}
                  onPress={() => setSelectedMetric(metric as any)}
                >
                  <Icon color={isSelected ? 'white' : colors.textSecondary} size={20} />
                  <Text
                    style={[
                      styles.metricButtonText,
                      { color: isSelected ? 'white' : colors.textSecondary }
                    ]}
                  >
                    {metric === 'heart_rate' ? 'Heart Rate' : metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Statistics */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.section}>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.background }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>{calculateAverage()}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>7-Day Average</Text>
              <Text style={[styles.statUnit, { color: colors.textSecondary }]}>{getMetricUnit(selectedMetric)}</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.background }]}>
              <Text style={[
                styles.statValue,
                { color: calculateTrend() >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {calculateTrend() >= 0 ? '+' : ''}{calculateTrend()}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Weekly Trend</Text>
              <Text style={[styles.statUnit, { color: colors.textSecondary }]}>vs last week</Text>
            </View>
          </View>
        </Animated.View>

        {/* Chart Section */}
        <Animated.View entering={FadeInUp.delay(700).duration(600)} style={styles.section}>
          <View style={[styles.chartSection, { backgroundColor: colors.background }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>7-Day Overview</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading data...</Text>
              </View>
            ) : (
              renderChart()
            )}
          </View>
        </Animated.View>

        {/* Health Metrics Cards */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Metrics</Text>
          </View>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Weight"
              value="--"
              unit="kg"
              icon={TrendingUp}
              color="#8B5CF6"
            />
            <MetricCard
              title="Sleep"
              value="--"
              unit="hrs"
              icon={Activity}
              color="#06B6D4"
            />
          </View>
        </Animated.View>

        {/* Health Insights */}
        <Animated.View entering={FadeInUp.delay(900).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Insights</Text>
          <View style={[styles.insightCard, { backgroundColor: colors.background }]}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIcon, { backgroundColor: '#F59E0B' }]}>
                <TrendingUp color="white" size={20} />
              </View>
              <Text style={[styles.insightTitle, { color: colors.text }]}>Weekly Summary</Text>
            </View>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              You're doing great! You've been consistently active this week. 
              Keep up the good work to reach your fitness goals.
            </Text>
          </View>

          <View style={[styles.insightsSection, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Text style={[styles.insightsTitle, { color: colors.warning }]}>💡 Health Insights</Text>
            <View style={styles.insightsList}>
              {selectedMetric === 'steps' && (
                <>
                  <Text style={[styles.insightItem, { color: colors.warning }]}>• Aim for 10,000 steps daily for optimal health</Text>
                  <Text style={[styles.insightItem, { color: colors.warning }]}>• Take short walks throughout the day</Text>
                  <Text style={[styles.insightItem, { color: colors.warning }]}>• Use stairs instead of elevators when possible</Text>
                </>
              )}
              {selectedMetric === 'calories' && (
                <>
                  <Text style={[styles.insightItem, { color: colors.warning }]}>• Consistent calorie burn indicates good activity levels</Text>
                  <Text style={[styles.insightItem, { color: colors.warning }]}>• Combine cardio and strength training</Text>
                  <Text style={[styles.insightItem, { color: colors.warning }]}>• Stay hydrated during exercise</Text>
                </>
              )}
              {selectedMetric === 'heart_rate' && (
                <>
                  <Text style={[styles.insightItem, { color: colors.warning }]}>• Lower resting heart rate indicates better fitness</Text>
                  <Text style={[styles.insightItem, { color: colors.warning }]}>• Monitor for unusual patterns or spikes</Text>
                  <Text style={[styles.insightItem, { color: colors.warning }]}>• Consult your doctor about concerning changes</Text>
                </>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
  },
  summaryText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    marginBottom: 8,
  },
  summarySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  cardGrid: {
    gap: 16,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  cardHalf: {
    flex: 1,
  },
  cardFull: {
    flex: 1,
  },
  heartRateCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  heartRateGradient: {
    padding: 20,
    borderRadius: 16,
  },
  heartRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heartRateTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    marginLeft: 12,
  },
  heartRateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heartRateValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    textAlign: 'center',
  },
  heartRateUnit: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  heartRateStats: {
    gap: 16,
  },
  heartRateStat: {
    alignItems: 'center',
  },
  heartRateStatValue: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
  },
  heartRateStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  goalsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  goalCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  goalValue: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  metricsSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  },
  statCard: {
    flex: 1,
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  chartSection: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
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
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  insightCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  insightsSection: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  insightsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});