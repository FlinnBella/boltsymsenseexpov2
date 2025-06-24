import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Activity, 
  Heart, 
  Target, 
  TrendingUp,
  Calendar,
  Plus,
  Zap
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useUserData } from '@/hooks/useUserData';
import { getUserProfile } from '@/lib/api/profile';
import { getTodayBiometricData } from '@/lib/api/healthTracking';
import HealthCard from '@/components/HealthCard';
import MetricCard from '@/components/MetricCard';
import CircularProgress from '@/components/CircularProgress';

export default function HomeScreen() {
  const { userData } = useUserData();
  const [userProfile, setUserProfile] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [userData]);

  const loadData = async () => {
    if (!userData) return;

    try {
      const [profile, biometricData] = await Promise.all([
        getUserProfile(userData.id),
        getTodayBiometricData(userData.id),
      ]);

      setUserProfile(profile);
      setTodayData(biometricData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading || !userData || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stepsGoal = userProfile.health_goal_steps || 10000;
  const caloriesGoal = userProfile.health_goal_calories || 2000;
  const activeMinutesGoal = userProfile.health_goal_active_minutes || 30;

  const stepsProgress = todayData?.steps ? (todayData.steps / stepsGoal) * 100 : 0;
  const caloriesProgress = todayData?.calories_burned ? (todayData.calories_burned / caloriesGoal) * 100 : 0;
  const activeMinutesProgress = todayData?.active_minutes ? (todayData.active_minutes / activeMinutesGoal) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greeting}>Good morning,</Text>
                <Text style={styles.userName}>{userProfile.first_name}</Text>
              </View>
              <TouchableOpacity style={styles.notificationButton}>
                <Calendar color="white" size={24} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.statsGrid}>
            <HealthCard
              title="Steps"
              value={todayData?.steps || 0}
              goal={stepsGoal}
              unit=""
              icon={Activity}
              color="#3B82F6"
              progress={stepsProgress}
            />
            <HealthCard
              title="Calories"
              value={todayData?.calories_burned || 0}
              goal={caloriesGoal}
              unit="kcal"
              icon={Zap}
              color="#EF4444"
              progress={caloriesProgress}
            />
            <HealthCard
              title="Active Minutes"
              value={todayData?.active_minutes || 0}
              goal={activeMinutesGoal}
              unit="min"
              icon={Target}
              color="#10B981"
              progress={activeMinutesProgress}
            />
          </View>
        </Animated.View>

        {/* Health Metrics */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Metrics</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Heart Rate"
              value={todayData?.heart_rate_avg || '--'}
              unit="bpm"
              icon={Heart}
              color="#EF4444"
              trend={5}
            />
            <MetricCard
              title="Weight"
              value={todayData?.weight_kg || '--'}
              unit="kg"
              icon={TrendingUp}
              color="#8B5CF6"
              trend={-2}
            />
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
                <Plus color="white" size={24} />
              </View>
              <Text style={styles.actionTitle}>Log Symptoms</Text>
              <Text style={styles.actionSubtitle}>Track how you feel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                <Plus color="white" size={24} />
              </View>
              <Text style={styles.actionTitle}>Add Medication</Text>
              <Text style={styles.actionSubtitle}>Record your meds</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Health Insights */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Health Insights</Text>
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIcon, { backgroundColor: '#F59E0B' }]}>
                <TrendingUp color="white" size={20} />
              </View>
              <Text style={styles.insightTitle}>Weekly Summary</Text>
            </View>
            <Text style={styles.insightText}>
              You're doing great! You've been consistently active this week. 
              Keep up the good work to reach your fitness goals.
            </Text>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  header: {
    marginBottom: 24,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#1F2937',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  statsGrid: {
    gap: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: 'white',
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
    color: '#1F2937',
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});