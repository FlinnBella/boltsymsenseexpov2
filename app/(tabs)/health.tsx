import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  Heart,
  Footprints,
  Flame,
  Moon,
  Weight,
  TrendingUp,
  Calendar,
  BarChart3,
  RefreshCw,
} from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useThemeColors } from '@/stores/useThemeStore';
import { useHealthTracking } from '@/hooks/useHealthTracking';
import HealthPermissionModal from '@/components/HealthPermissionModal';
import HealthChart from '@/components/HealthChart';

type TimeRange = 'daily' | 'weekly' | 'monthly';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: any;
  color: string;
  goal?: number;
  delay?: number;
}

const MetricCard = ({ title, value, unit, icon: Icon, color, goal, delay = 0 }: MetricCardProps) => {
  const colors = useThemeColors();
  const progress = goal ? Math.min((value / goal) * 100, 100) : 0;

  return (
    <Animated.View entering={FadeInRight.delay(delay).duration(600)}>
      <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
            <Icon color={color} size={24} />
          </View>
          <Text style={[styles.metricTitle, { color: colors.text }]}>{title}</Text>
        </View>
        
        <Text style={[styles.metricValue, { color: colors.text }]}>
          {value.toLocaleString()}
          <Text style={[styles.metricUnit, { color: colors.textSecondary }]}> {unit}</Text>
        </Text>
        
        {goal && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: color, width: `${progress}%` }
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {progress.toFixed(0)}% of {goal.toLocaleString()} {unit}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default function HealthScreen() {
  const colors = useThemeColors();
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    isInitialized,
    hasPermissions,
    showPermissionModal,
    currentData,
    historicalData,
    isLoading,
    error,
    lastSyncTime,
    requestPermissions,
    denyPermissions,
    refreshData,
    retryPermissions,
    isAvailable,
  } = useHealthTracking();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleRetryPermissions = () => {
    Alert.alert(
      'Enable Health Tracking',
      'Would you like to enable health tracking to get personalized insights and automatic data sync?',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Enable', onPress: retryPermissions },
      ]
    );
  };

  const getTimeRangeData = () => {
    if (!historicalData) return [];

    const now = new Date();
    let days = 7;
    
    switch (timeRange) {
      case 'daily':
        days = 7;
        break;
      case 'weekly':
        days = 30;
        break;
      case 'monthly':
        days = 90;
        break;
    }

    return historicalData.steps?.slice(-days) || [];
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.loadingContainer}>
          <Activity color={colors.primary} size={32} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Initializing health tracking...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAvailable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.errorContainer}>
          <Heart color={colors.textSecondary} size={48} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Health Tracking Unavailable
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Health tracking is not available on this platform. Please use a physical device with health services.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermissions && !showPermissionModal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.permissionContainer}>
          <Heart color={colors.primary} size={64} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Enable Health Tracking
          </Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            Connect your health data to get personalized insights and track your progress automatically.
          </Text>
          <TouchableOpacity
            style={[styles.enableButton, { backgroundColor: colors.primary }]}
            onPress={handleRetryPermissions}
          >
            <Heart color="white" size={20} />
            <Text style={styles.enableButtonText}>Enable Health Tracking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Health Metrics</Text>
        <View style={styles.headerActions}>
          {lastSyncTime && (
            <Text style={[styles.syncTime, { color: colors.textSecondary }]}>
              Last sync: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.background }]}
            onPress={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <Animated.View entering={FadeInUp.duration(400)} style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
            <Text style={[styles.errorBannerText, { color: colors.error }]}>
              {error}
            </Text>
          </Animated.View>
        )}

        {/* Current Metrics */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Activity</Text>
          
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Steps"
              value={currentData?.steps || 0}
              unit="steps"
              icon={Footprints}
              color="#3B82F6"
              goal={10000}
              delay={0}
            />
            
            <MetricCard
              title="Calories"
              value={currentData?.calories || 0}
              unit="kcal"
              icon={Flame}
              color="#F97316"
              goal={2000}
              delay={100}
            />
            
            <MetricCard
              title="Heart Rate"
              value={currentData?.heartRate || 0}
              unit="bpm"
              icon={Heart}
              color="#EF4444"
              delay={200}
            />
            
            <MetricCard
              title="Active Minutes"
              value={currentData?.activeMinutes || 0}
              unit="min"
              icon={Activity}
              color="#10B981"
              goal={60}
              delay={300}
            />
            
            <MetricCard
              title="Sleep"
              value={currentData?.sleep || 0}
              unit="hours"
              icon={Moon}
              color="#8B5CF6"
              goal={8}
              delay={400}
            />
            
            <MetricCard
              title="Weight"
              value={currentData?.weight || 0}
              unit="kg"
              icon={Weight}
              color="#06B6D4"
              delay={500}
            />
          </View>
        </Animated.View>

        {/* Time Range Selector */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.section}>
          <View style={styles.timeRangeHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Trends</Text>
            <View style={styles.timeRangeSelector}>
              {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.timeRangeButton,
                    {
                      backgroundColor: timeRange === range ? colors.primary : colors.background,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setTimeRange(range)}
                >
                  <Text
                    style={[
                      styles.timeRangeText,
                      { color: timeRange === range ? 'white' : colors.textSecondary }
                    ]}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Charts */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.section}>
          <HealthChart
            data={getTimeRangeData()}
            title="Steps"
            color="#3B82F6"
            unit="steps"
          />
          
          <HealthChart
            data={historicalData?.calories?.slice(-30) || []}
            title="Calories Burned"
            color="#F97316"
            unit="kcal"
          />
          
          <HealthChart
            data={historicalData?.heartRate?.slice(-30) || []}
            title="Heart Rate"
            color="#EF4444"
            unit="bpm"
          />
        </Animated.View>

        {/* Health Insights */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.section}>
          <View style={[styles.insightCard, { backgroundColor: colors.background }]}>
            <View style={styles.insightHeader}>
              <TrendingUp color={colors.primary} size={24} />
              <Text style={[styles.insightTitle, { color: colors.text }]}>
                Weekly Summary
              </Text>
            </View>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              {currentData?.steps && currentData.steps >= 8000
                ? "Great job! You're staying active and meeting your daily step goals."
                : "Try to increase your daily activity to reach your step goals for better health."}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <HealthPermissionModal
        visible={showPermissionModal}
        onAllow={requestPermissions}
        onDeny={denyPermissions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 24,
  },
  permissionTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  enableButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  errorBanner: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorBannerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  metricUnit: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  timeRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeRangeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  insightCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 12,
  },
  insightText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
});