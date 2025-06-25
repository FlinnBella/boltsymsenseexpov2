import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Footprints,
  Flame,
  Moon,
  Activity,
  Target,
  Plus,
  Bell,
  Apple,
  TrendingUp,
} from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

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
                  You've completed {Math.round((calculateProgress(healthData.steps, preferences.healthGoals.steps) + calculateProgress(healthData.calories, preferences.healthGoals.calories)) / 2)}% of your daily goals
                </Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Main Health Cards */}
          <View style={styles.section}>
            <View style={styles.cardGrid}>
              <View style={styles.cardRow}>
                <View style={styles.cardHalf}>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/health-metrics')}>
                    <HealthCard
                      title="Steps"
                      value={healthData.steps.toLocaleString()}
                      icon={Footprints}
                      colors={['#3B82F6', '#1E40AF']}
                      progress={calculateProgress(healthData.steps, preferences.healthGoals.steps)}
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
                      progress={calculateProgress(healthData.calories, preferences.healthGoals.calories)}
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
          </View>

          {/* Secondary Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/health-metrics')}>
                  <MetricCard
                    title="Sleep"
                    value={healthData.sleep.toFixed(1)}
                    unit="hours"
                    icon={Moon}
                    color="#8B5CF6"
                    change={5}
                    delay={500}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.metricItem}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/health-metrics')}>
                  <MetricCard
                    title="Active Minutes"
                    value={healthData.activeMinutes}
                    unit="min"
                    icon={Activity}
                    color="#10B981"
                    change={-2}
                    delay={600}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.metricItem}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/health-metrics')}>
                  <MetricCard
                    title="Distance"
                    value={healthData.distance.toFixed(1)}
                    unit="km"
                    icon={Target}
                    color="#F59E0B"
                    change={12}
                    delay={700}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/log-symptoms')}
              >
                <Plus color="#F97316" size={24} />
                <Text style={styles.actionText}>Log Symptoms</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/add-medication')}
              >
                <Plus color="#F97316" size={24} />
                <Text style={styles.actionText}>Add Medication</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowFoodModal(true)}
              >
                <Apple color="#F97316" size={24} />
                <Text style={styles.actionText}>Log Food</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/health-metrics')}
              >
                <TrendingUp color="#F97316" size={24} />
                <Text style={styles.actionText}>Health Metrics</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Health Tip */}
          <Animated.View entering={FadeInUp.delay(900).duration(600)} style={styles.section}>
            <View style={styles.tipCard}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' }}
                style={styles.tipImage}
              />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Daily Health Tip</Text>
                <Text style={styles.tipText}>
                  Stay hydrated! Aim for 8 glasses of water throughout the day to maintain optimal health.
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        <WearableConnectionModal
          visible={showWearableModal}
          onConnect={handleConnectWearable}
          onDismiss={handleDismissWearable}
        />

        <FoodLogModal
          visible={showFoodModal}
          onClose={() => setShowFoodModal(false)}
          onSave={() => {}}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 20,
  },
  summaryText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardGrid: {
    gap: 16,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cardHalf: {
    flex: 1,
  },
  cardFull: {
    flex: 1,
  },
  heartRateCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heartRateGradient: {
    padding: 20,
  },
  heartRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heartRateTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  heartRateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heartRateValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  heartRateUnit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  heartRateStats: {
    gap: 16,
  },
  heartRateStat: {
    alignItems: 'center',
  },
  heartRateStatValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  heartRateStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    width: '48%',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
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
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginTop: 8,
  },
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipImage: {
    width: '100%',
    height: 120,
  },
  tipContent: {
    padding: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});