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
  Zap,
  Bell,
  Footprints,
  Flame
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { getUserProfile } from '@/lib/api/profile';
import HealthCard from '@/components/HealthCard';
import MetricCard from '@/components/MetricCard';
import CircularProgress from '@/components/CircularProgress';
import ConnectionStatus from '@/components/ConnectionStatus';
import WearableConnectionModal from '@/components/Modal/WearableConnectionModal';
import FoodLogModal from '@/components/Modal/FoodLogModal';
import LoadingScreen from '@/components/LoadingScreen';
import { getUserPreferences, saveUserPreferences, UserPreferences, defaultPreferences } from '@/lib/storage';
import { getUserPreferencesFromDB, updateUserPreferencesInDB, getCachedHealthData, updateCachedHealthData } from '@/lib/api/profile';
import { getUserPreferences as getHealthTrackingPreferences, createOrUpdateUserPreferences, dismissWearablePrompt } from '@/lib/api/healthTracking';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useUserStore, useUserProfile, useHealthData, useUserPreferences, useIsLoadingProfile, useIsLoadingHealthData, useIsLoadingPreferences } from '@/stores/useUserStore';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWearableModal, setShowWearableModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  // Use Zustand store instead of local state
  const userProfile = useUserProfile();
  const healthData = useHealthData();
  const preferences = useUserPreferences();
  const isLoadingProfile = useIsLoadingProfile();
  const isLoadingHealthData = useIsLoadingHealthData();
  const isLoadingPreferences = useIsLoadingPreferences();
  const { fetchHealthData, updatePreferences } = useUserStore();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    
    try {
      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await Promise.all([
        checkWearablePrompt(),
      ]);
      
      // User data is already loaded from Zustand store via AuthGuard
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove loadUserData - using Zustand store

  // Remove loadHealthData - using Zustand store

  // Remove loadUserPreferences - using Zustand store

  const checkWearablePrompt = async () => {
    try {
      if (!userProfile || !preferences) return;

      // Show modal if user hasn't connected wearable and hasn't dismissed prompt
      if (!preferences.wearableConnected && !preferences.wearablePromptDismissed) {
        setTimeout(() => {
          setShowWearableModal(true);
        }, 1000); // Show after loading screen
      }
    } catch (error) {
      console.error('Error checking wearable prompt:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchHealthData();
    } catch (error) {
      console.error('Error refreshing health data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.round((current / goal) * 100);
  };

  const handleConnectWearable = () => {
    setShowWearableModal(false);
    router.push('/(tabs)/profile');
  };

  const handleDismissWearable = async () => {
    setShowWearableModal(false);
    try {
      await updatePreferences({ wearablePromptDismissed: true });
    } catch (error) {
      console.error('Error dismissing wearable prompt:', error);
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <>
      <LoadingScreen visible={loading} />
      
      <SafeAreaView style={styles.container}>
        <ConnectionStatus />
        
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good Morning</Text>
              <Text style={styles.userName}>
                {userProfile?.first_name ? capitalizeFirstLetter(userProfile.first_name) : 'User'}
              </Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell color="#6B7280" size={24} />
            </TouchableOpacity>
          </Animated.View>

          {/* Today's Summary */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Health</Text>
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={['#3B82F6', '#1E40AF']}
                style={styles.summaryGradient}
              >
                <Text style={styles.summaryText}>You're doing great!</Text>
                <Text style={styles.summarySubtext}>
                  You've completed {Math.round((calculateProgress(healthData.steps, healthData.HealthGoals.steps) + calculateProgress(healthData.calories, healthData.HealthGoals.calories)) / 2)}% of your daily goals
                </Text>
              </LinearGradient>
            </View>
                  </Animated.View>

          {/* Main Health Cards */}
          <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.section}>
            <View style={styles.cardGrid}>
              <View style={styles.cardRow}>
                <View style={styles.cardHalf}>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/health-metrics')}>
                    <HealthCard
                      title="Steps"
                      value={healthData.steps.toLocaleString()}
                      icon={Footprints}
                      colors={['#3B82F6', '#1E40AF']}
                      progress={calculateProgress(healthData.steps, healthData.HealthGoals.steps)}
                      delay={300}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardHalf}>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/health-metrics')}>
                    <HealthCard
                      title="Calories"
                      value={healthData.calories}
                      unit="kcal"
                      icon={Flame}
                      colors={['#F97316', '#EA580C']}
                      progress={calculateProgress(healthData.calories, healthData.HealthGoals.calories)}
                      delay={400}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardRow}>
                <View style={styles.cardFull}>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/health-metrics')}>
                    <View style={styles.heartRateCard}>
                      <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={styles.heartRateGradient}
                      >
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
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
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
              value={healthData.heartRate || '--'}
              unit="bpm"
              icon={Heart}
              color="#EF4444"
            />
            <MetricCard
              title="Weight"
              value="--"
              unit="kg"
              icon={TrendingUp}
              color="#8B5CF6"
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

      {/* Modals */}
      <WearableConnectionModal
        visible={showWearableModal}
        onConnect={handleConnectWearable}
        onDismiss={handleDismissWearable}
      />
      <FoodLogModal
        visible={showFoodModal}
        onClose={() => setShowFoodModal(false)}
        onSave={() => setShowFoodModal(false)}
      />
    </SafeAreaView>
    </>
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
  // Missing styles
  summaryCard: {
    marginBottom: 16,
  },
  summaryGradient: {
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
});