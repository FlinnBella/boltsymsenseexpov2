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
import { User, Settings, Bell, Heart, Shield, LogOut, CreditCard as Edit, Smartphone, Target, Calendar, Pill, Plus, Activity } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';
import { getUserPreferences, saveUserPreferences, clearUserPreferences, UserPreferences, defaultPreferences } from '@/lib/storage';
import { getUserProfile, getPatientProfile, getHealthGoals, updateHealthGoal, getUserPreferencesFromDB, updateUserPreferencesInDB, UserProfile, PatientProfile } from '@/lib/api/profile';
import { getTerraConnections, terraAPI, saveTerraConnection } from '@/lib/api/terra';
import ProfileEditModal from '@/components/Modal/ProfileEditModal';
import WearableConnectionModal from '@/components/Modal/WearableConnectionModal';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserData } from '@/hooks/useUserData';

export default function ProfileScreen() {
  const { userData, clearUserData } = useUserData();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [terraConnections, setTerraConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWearableConnectionModal, setShowWearableConnectionModal] = useState(false);

 
  useEffect(() => {
    loadUserData();
    loadPreferences();
  }, );

  

  const loadUserData = async () => {
    try {
      //const { data } = await supabase.auth.getUser();
      console.log('User:', userData);
      if (!userData) {
              const {
              data: { session },
              error
              } = await supabase.auth.getSession().session.user;
      };
      console.log("Data", data);
      const profile = await getUserProfile(userData.id);
      console.log('Profile:', profile);
      setUserProfile(profile);

      const patientData = await getPatientProfile(userData.id);
      console.log('Patient Data:', patientData);
      setPatientProfile(patientData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      if (!userData) return;

      // First try to get from AsyncStorage (fast)
      let prefs = await getUserPreferences();

      // Check if we have default preferences (meaning nothing was cached)
      const isDefaultPrefs = JSON.stringify(prefs) === JSON.stringify(defaultPreferences);
      
      if (isDefaultPrefs) {
        try {
          // If using defaults, try to get from DB
          prefs = await getUserPreferencesFromDB(userData.id);
          // Cache the DB preferences in AsyncStorage
          await saveUserPreferences(prefs);
        } catch (error) {
          console.error('Error loading preferences from DB, using defaults:', error);
          // Keep using defaults if DB fails
        }
      }

      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      setPreferences(defaultPreferences);
    }
  };

  const loadTerraConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const connections = await getTerraConnections(user.id);
      setTerraConnections(connections);
    } catch (error) {
      console.error('Error loading Terra connections:', error);
    }
  };

  const updateNotificationPreference = async (key: keyof UserPreferences['notifications'], value: boolean) => {
    if (!preferences || !userData) return;

    const updatedPreferences = {
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value,
      },
    };

    try {
      // Update local state immediately for better UX
      setPreferences(updatedPreferences);
      
      // Update AsyncStorage
      await saveUserPreferences(updatedPreferences);
      
      // Update database
      await updateUserPreferencesInDB(userData.id, updatedPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Revert on error
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update preference. Please try again.');
    }
  };

  const handleConnectWearable = async () => {
    if (!userData) return;

    Alert.alert(
      'Connect Wearable Device',
      'Choose your wearable device provider:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apple Health', onPress: () => connectProvider('APPLE') },
        { text: 'Google Fit', onPress: () => connectProvider('GOOGLE') },
        { text: 'Fitbit', onPress: () => connectProvider('FITBIT') },
        { text: 'Garmin', onPress: () => connectProvider('GARMIN') },
      ]
    );
  };

  const connectProvider = async (provider: string) => {
    try {
      if (!userData) return;

      const referenceId = `${userData.id}_${provider}_${Date.now()}`;
      const authData = await terraAPI.generateAuthURL(provider, referenceId);

      if (authData.auth_url) {
        const result = await WebBrowser.openBrowserAsync(authData.auth_url);
        
        if (result.type === 'dismiss') {
          // User closed the browser, check if connection was successful
          setTimeout(async () => {
            try {
              await saveTerraConnection({
                user_id: userData.id,
                terra_user_id: authData.user_id,
                provider,
                reference_id: referenceId,
                is_active: true,
                last_sync_at: null,
              });
              
              Alert.alert('Success', `${provider} connected successfully!`);
              loadTerraConnections();
            } catch (error) {
              console.error('Error saving connection:', error);
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error connecting provider:', error);
      Alert.alert('Error', 'Failed to connect wearable device. Please try again.');
    }
  };

  const handleDisconnectWearable = (connection: any) => {
    Alert.alert(
      'Disconnect Wearable',
      `Are you sure you want to disconnect ${connection.provider}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await terraAPI.deauthUser(connection.terra_user_id);
              Alert.alert('Success', 'Wearable disconnected successfully');
              loadTerraConnections();
            } catch (error) {
              console.error('Error disconnecting wearable:', error);
              Alert.alert('Error', 'Failed to disconnect wearable');
            }
          },
        },
      ]
    );
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
            try {
              // Clear UserContext data
              await clearUserData();
              // Sign out from Supabase
              await supabase.auth.signOut();
              // Clear auth token
              await AsyncStorage.removeItem('authToken');
              // Navigate to login
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out completely. Please try again.');
            }
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
          {subtitle ? <Text style={styles.profileItemSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
        {rightElement}
    </TouchableOpacity>
  );

  if (loading || !userData || !userProfile || !preferences) {
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
      <WearableConnectionModal visible={showWearableConnectionModal} onConnect={handleConnectWearable} onDismiss={() => setShowWearableConnectionModal(false)} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.headerGradient}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <User color="white" size={32} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {userProfile.first_name} {userProfile.last_name}
                </Text>
                <Text style={styles.profileEmail}>{userProfile.email}</Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setShowEditModal(true)}
              >
                <Edit color="white" size={20} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        
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
              icon={Activity}
              title="Active Minutes"
              subtitle={`${preferences.healthGoals.activeMinutes} minutes`}
              onPress={() => {}}
            />
          </ProfileSection>
        </Animated.View>

        
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <ProfileSection title="Connected Devices">
            {terraConnections.length > 0 ? (
              terraConnections.map((connection) => (
                <ProfileItem
                  key={connection.id}
                  icon={Smartphone}
                  title={connection.provider}
                  subtitle={connection.is_active ? 'Connected' : 'Disconnected'}
                  onPress={() => handleDisconnectWearable(connection)}
                />
              ))
            ) : (
              <ProfileItem
                icon={Plus}
                title="Connect Wearable Device"
                subtitle="Connect your fitness tracker or smartwatch"
                onPress={handleConnectWearable}
              />
            )}
          </ProfileSection>
        </Animated.View>

        
        <Animated.View entering={FadeInUp.delay(600).duration(600)}>
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

        
        <Animated.View entering={FadeInUp.delay(800).duration(600)}>
          <ProfileSection title="Settings">
            <ProfileItem
              icon={Settings}
              title="App Settings"
              subtitle="Customize your profile"
              onPress={() => {setShowEditModal(true)}}
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

        
        <Animated.View entering={FadeInUp.delay(1000).duration(600)} style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            This app provides general health information and is not intended to replace professional medical advice, 
            diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns. 
            In case of emergency, contact emergency services immediately.
          </Text>
        </Animated.View>
      </ScrollView>

      <ProfileEditModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        userProfile={userProfile}
        patientProfile={patientProfile}
        onSave={loadUserData}
      />
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