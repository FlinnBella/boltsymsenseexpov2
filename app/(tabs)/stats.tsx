import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Activity, 
  Heart, 
  TrendingUp,
  TrendingDown,
  Footprints,
  Flame,
  Bell,
  Minus,
} from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

import { useUserStore, useUserProfile, useHealthData, useUserPreferences } from '@/stores/useUserStore';
import { useThemeColors } from '@/stores/useThemeStore';
import { initializeHealthKit, getHealthData, HealthMetric } from '@/lib/healthKit';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 200;

interface WeeklyData {
  date: string;
  steps: number;
  calories: number;
  heartRate: number;
}

interface MetricConfig {
  key: 'steps' | 'calories' | 'heartRate';
  label: string;
  icon: any;
  color: string;
  unit: string;
  goal: number;
}

const METRICS: MetricConfig[] = [
  { key: 'steps', label: 'Steps', icon: Footprints, color: '#3B82F6', unit: 'steps', goal: 10000 },
  { key: 'calories', label: 'Calories', icon: Flame, color: '#F97316', unit: 'kcal', goal: 2000 },
  { key: 'heartRate', label: 'Heart Rate', icon: Heart, color: '#EF4444', unit: 'bpm', goal: 70 },
];

export default function StatsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'steps' | 'calories' | 'heartRate'>('steps');
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthKitAvailable, setHealthKitAvailable] = useState(false);
  
  const userProfile = useUserProfile();
  const healthData = useHealthData();
  const preferences = useUserPreferences();
  const { fetchHealthData, updateHealthData } = useUserStore();
  const colors = useThemeColors();

  useEffect(() => {
    initializeHealthData();
  }, []);

  const initializeHealthData = async () => {
    setLoading(true);
    try {
      // Check if HealthKit is available (iOS only)
      if (Platform.OS === 'ios') {
        const available = await initializeHealthKit();
        setHealthKitAvailable(available);
        
        if (available) {
          await syncHealthKitData();
        }
      }
      
      // Generate mock weekly data for demonstration
      generateMockWeeklyData();
    } catch (error) {
      console.error('Error initializing health data:', error);
      generateMockWeeklyData();
    } finally {
      setLoading(false);
    }
  };

  const syncHealthKitData = async () => {
    try {
      const healthMetrics = await getHealthData();
      
      // Update current health data in store
      await updateHealthData({
        steps: healthMetrics.steps || healthData.steps,
        calories: healthMetrics.calories || healthData.calories,
        heartRate: healthMetrics.heartRate || healthData.heartRate,
      });
    } catch (error) {
      console.error('Error syncing HealthKit data:', error);
    }
  };

  const generateMockWeeklyData = () => {
    const data: WeeklyData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Generate realistic mock data with some variation
      const baseSteps = 8000 + Math.random() * 4000;
      const baseCalories = 1800 + Math.random() * 600;
      const baseHeartRate = 65 + Math.random() * 20;
      
      data.push({
        date: date.toISOString().split('T')[0],
        steps: Math.round(baseSteps),
        calories: Math.round(baseCalories),
        heartRate: Math.round(baseHeartRate),
      });
    }
    
    setWeeklyData(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchHealthData(),
        healthKitAvailable ? syncHealthKitData() : Promise.resolve(),
      ]);
      generateMockWeeklyData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getCurrentMetricConfig = () => {
    return METRICS.find(m => m.key === selectedMetric) || METRICS[0];
  };

  const getMetricValue = (data: WeeklyData, metric: string) => {
    switch (metric) {
      case 'steps':
        return data.steps;
      case 'calories':
        return data.calories;
      case 'heartRate':
        return data.heartRate;
      default:
        return 0;
    }
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
    
    if (firstAvg === 0) return 0;
    return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
  };

  const renderLineChart = () => {
    if (weeklyData.length === 0) return null;

    const currentMetric = getCurrentMetricConfig();
    const values = weeklyData.map(d => getMetricValue(d, selectedMetric));
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * (CHART_WIDTH - 40) + 20;
      const y = CHART_HEIGHT - 40 - ((value - minValue) / range) * (CHART_HEIGHT - 80);
      return { x, y, value };
    });

    // Create smooth curve path
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpy1 = prev.y;
      const cpx2 = curr.x - (curr.x - prev.x) / 3;
      const cpy2 = curr.y;
      pathData += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }

    return (
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <Line
              key={i}
              x1={20}
              y1={20 + (i * (CHART_HEIGHT - 40) / 4)}
              x2={CHART_WIDTH - 20}
              y2={20 + (i * (CHART_HEIGHT - 40) / 4)}
              stroke={colors.border}
              strokeWidth={1}
              opacity={0.3}
            />
          ))}
          
          {/* Chart line */}
          <Path
            d={pathData}
            stroke={currentMetric.color}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={currentMetric.color}
              stroke="white"
              strokeWidth={2}
            />
          ))}
          
          {/* Day labels */}
          {weeklyData.map((data, index) => {
            const x = (index / (weeklyData.length - 1)) * (CHART_WIDTH - 40) + 20;
            const date = new Date(data.date);
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });
            
            return (
              <SvgText
                key={index}
                x={x}
                y={CHART_HEIGHT - 10}
                fontSize={12}
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {dayName}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    );
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const currentMetric = getCurrentMetricConfig();
  const average = calculateAverage();
  const trend = calculateTrend();
  const todayValue = weeklyData.length > 0 ? getMetricValue(weeklyData[weeklyData.length - 1], selectedMetric) : 0;

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
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good Morning</Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {userProfile?.first_name ? capitalizeFirstLetter(userProfile.first_name) : 'User'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.background }]}>
              <Bell color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Health Status Banner */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.section}>
          <View style={[styles.statusBanner, { backgroundColor: colors.primary }]}>
            <Text style={styles.statusText}>Your Health Journey</Text>
            <Text style={styles.statusSubtext}>
              {healthKitAvailable ? 'Connected to Health app' : 'Tracking your progress'}
            </Text>
          </View>
        </Animated.View>

        {/* Metric Selector */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Metrics</Text>
          <View style={styles.metricsSelector}>
            {METRICS.map((metric) => {
              const Icon = metric.icon;
              const isSelected = selectedMetric === metric.key;
              
              return (
                <TouchableOpacity
                  key={metric.key}
                  style={[
                    styles.metricButton,
                    { 
                      backgroundColor: isSelected ? metric.color : colors.background,
                      borderColor: isSelected ? metric.color : colors.border,
                    }
                  ]}
                  onPress={() => setSelectedMetric(metric.key)}
                >
                  <Icon 
                    color={isSelected ? 'white' : colors.textSecondary} 
                    size={20} 
                  />
                  <Text
                    style={[
                      styles.metricButtonText,
                      { color: isSelected ? 'white' : colors.textSecondary }
                    ]}
                  >
                    {metric.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Statistics Cards */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.section}>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.background }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {average.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                7-Day Average
              </Text>
              <Text style={[styles.statUnit, { color: colors.textSecondary }]}>
                {currentMetric.unit}
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.background }]}>
              <View style={styles.trendContainer}>
                {trend >= 0 ? (
                  <TrendingUp color="#10B981" size={16} />
                ) : (
                  <TrendingDown color="#EF4444" size={16} />
                )}
                <Text style={[
                  styles.statValue,
                  { color: trend >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Weekly Trend
              </Text>
              <Text style={[styles.statUnit, { color: colors.textSecondary }]}>
                vs last week
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Chart Section */}
        <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.section}>
          <View style={[styles.chartSection, { backgroundColor: colors.background }]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                7-Day Overview
              </Text>
              <View style={styles.currentValueContainer}>
                <Text style={[styles.currentValueLabel, { color: colors.textSecondary }]}>
                  Today
                </Text>
                <Text style={[styles.currentValue, { color: currentMetric.color }]}>
                  {todayValue.toLocaleString()} {currentMetric.unit}
                </Text>
              </View>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Activity color={colors.textSecondary} size={24} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading health data...
                </Text>
              </View>
            ) : (
              renderLineChart()
            )}
          </View>
        </Animated.View>

        {/* Health Insights */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Insights</Text>
          <View style={[styles.insightCard, { backgroundColor: colors.background }]}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIcon, { backgroundColor: currentMetric.color }]}>
                <TrendingUp color="white" size={20} />
              </View>
              <Text style={[styles.insightTitle, { color: colors.text }]}>
                {currentMetric.label} Analysis
              </Text>
            </View>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              {selectedMetric === 'steps' && 
                `Your average of ${average.toLocaleString()} steps is ${average >= 10000 ? 'excellent' : 'good'}! ${average >= 10000 ? 'Keep up the great work.' : 'Try to reach 10,000 steps daily for optimal health.'}`
              }
              {selectedMetric === 'calories' && 
                `You're burning an average of ${average.toLocaleString()} calories daily. ${average >= 2000 ? 'Great job staying active!' : 'Consider increasing your activity level to burn more calories.'}`
              }
              {selectedMetric === 'heartRate' && 
                `Your average heart rate of ${average} bpm is ${average <= 80 ? 'within a healthy range' : 'slightly elevated'}. ${average <= 80 ? 'This indicates good cardiovascular health.' : 'Consider consulting with a healthcare provider.'}`
              }
            </Text>
          </View>
        </Animated.View>

        {/* Health Tips */}
        <Animated.View entering={FadeInUp.delay(700).duration(600)} style={styles.section}>
          <View style={[styles.tipsSection, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Text style={[styles.tipsTitle, { color: colors.warning }]}>💡 Health Tips</Text>
            <View style={styles.tipsList}>
              {selectedMetric === 'steps' && (
                <>
                  <Text style={[styles.tipItem, { color: colors.warning }]}>• Take the stairs instead of elevators</Text>
                  <Text style={[styles.tipItem, { color: colors.warning }]}>• Park further away from your destination</Text>
                  <Text style={[styles.tipItem, { color: colors.warning }]}>• Take short walks during breaks</Text>
                </>
              )}
              {selectedMetric === 'calories' && (
                <>
                  <Text style={[styles.tipItem, { color: colors.warning }]}>• Combine cardio and strength training</Text>
                  <Text style={[styles.tipItem, { color: colors.warning }]}>• Stay hydrated during exercise</Text>
                  <Text style={[styles.tipItem, { color: colors.warning }]}>• Maintain consistent activity levels</Text>
                </>
              )}
              {selectedMetric === 'heartRate' && (
                <>
                  <Text style={[styles.tipItem, { color: colors.warning }]}>• Monitor for unusual patterns</Text>
                  <Text style={[styles.tipItem, { color: colors.warning }]}>• Practice stress management techniques</Text>
                  <Text style={[styles.tipItem, { color: colors.warning }]}>• Get adequate sleep for heart health</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statusBanner: {
    borderRadius: 16,
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  metricsSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
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
    textAlign: 'center',
  },
  statUnit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  chartSection: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  currentValueContainer: {
    alignItems: 'flex-end',
  },
  currentValueLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  currentValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  chartContainer: {
    alignItems: 'center',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  insightCard: {
    borderRadius: 16,
    padding: 20,
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
  tipsSection: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});