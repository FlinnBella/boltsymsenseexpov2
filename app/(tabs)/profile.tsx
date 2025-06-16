import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Bell, Heart, Shield, LogOut, CreditCard as Edit, Smartphone, Target, Calendar, Pill } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { supabase } from '@/lib/supabase';
import { getUserPreferences, saveUserPreferences, UserPreferences } from '@/lib/storage';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    loadUserData();
    loadPreferences();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadPreferences = async () => {
    const prefs = await getUserPreferences();
    setPreferences(prefs);
  };

  const updateNotificationPreference = async (key: keyof UserPreferences['notifications'], value: boolean) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value,
      },
    };

    setPreferences(updatedPreferences);
    await saveUserPreferences(updatedPreferences);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const ProfileItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightElement,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <View style={styles.profileItemIcon}>
          <Icon color="#6B7280" size={20} />
        </View>
        <View>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  if (!user || !preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.headerGradient}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <User color="white" size={32} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                </Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Edit color="white" size={20} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Health Goals */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <ProfileSection title="Health Goals">
            <ProfileItem
              icon={Target}
              title="Daily Steps"
              subtitle={`${preferences.healthGoals.steps.toLocaleString()} steps`}
              onPress={() => {}}
            />
            <ProfileItem
              icon={Heart}
              title="Calories Goal"
              subtitle={`${preferences.healthGoals.calories} kcal`}
              onPress={() => {}}
            />
            <ProfileItem
              icon={Calendar}
              title="Active Minutes"
              subtitle={`${preferences.healthGoals.activeMinutes} minutes`}
              onPress={() => {}}
            />
          </ProfileSection>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <ProfileSection title="Notifications">
            <ProfileItem
              icon={Bell}
              title="Achievement Notifications"
              subtitle="Get notified when you reach your goals"
              rightElement={
                <Switch
                  value={preferences.notifications.achievements}
                  onValueChange={(value) => updateNotificationPreference('achievements', value)}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="white"
                />
              }
            />
            <ProfileItem
              icon={Heart}
              title="Health Alerts"
              subtitle="Important health reminders and alerts"
              rightElement={
                <Switch
                  value={preferences.notifications.healthAlerts}
                  onValueChange={(value) => updateNotificationPreference('healthAlerts', value)}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="white"
                />
              }
            />
            <ProfileItem
              icon={Pill}
              title="Medication Reminders"
              subtitle="Never miss your medications"
              rightElement={
                <Switch
                  value={preferences.notifications.medications}
                  onValueChange={(value) => updateNotificationPreference('medications', value)}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="white"
                />
              }
            />
            <ProfileItem
              icon={Calendar}
              title="Appointment Reminders"
              subtitle="Get reminded about upcoming appointments"
              rightElement={
                <Switch
                  value={preferences.notifications.appointments}
                  onValueChange={(value) => updateNotificationPreference('appointments', value)}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="white"
                />
              }
            />
          </ProfileSection>
        </Animated.View>

        {/* Connected Devices */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)}>
          <ProfileSection title="Connected Devices">
            <ProfileItem
              icon={Smartphone}
              title="Apple Health"
              subtitle="Connected"
              onPress={() => {}}
            />
            <ProfileItem
              icon={Smartphone}
              title="Google Fit"
              subtitle="Not connected"
              onPress={() => {}}
            />
          </ProfileSection>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)}>
          <ProfileSection title="Settings">
            <ProfileItem
              icon={Settings}
              title="App Settings"
              subtitle="Customize your experience"
              onPress={() => {}}
            />
            <ProfileItem
              icon={Shield}
              title="Privacy & Security"
              subtitle="Manage your data and privacy"
              onPress={() => {}}
            />
            <ProfileItem
              icon={LogOut}
              title="Sign Out"
              subtitle="Sign out of your account"
              onPress={handleSignOut}
            />
          </ProfileSection>
        </Animated.View>

        {/* Medical Disclaimer */}
        <Animated.View entering={FadeInUp.delay(1000).duration(600)} style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            This app provides general health information and is not intended to replace professional medical advice, 
            diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns. 
            In case of emergency, contact emergency services immediately.
          </Text>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  profileItemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  disclaimer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    lineHeight: 20,
  },
});