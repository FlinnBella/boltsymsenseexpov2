import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Bell, Heart, Shield, LogOut, CreditCard as Edit, Smartphone, Target, Calendar, Pill, Plus, Activity, Moon, Sun, Chrome as Home, Camera } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';
import ProfileEditModal from '@/components/Modal/ProfileEditModal';
import WearableConnectionModal from '@/components/Modal/WearableConnectionModal';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore, useUserProfile, useUserPreferences, useIsLoadingProfile, useIsLoadingPreferences, useHealthData } from '@/stores/useUserStore';
import { useThemeStore, useIsDarkMode, useThemeColors } from '@/stores/useThemeStore';
import { getUserProfile, getPatientProfile, PatientProfile } from '@/lib/api/profile';

export default function ProfileScreen() {
  // Use Zustand stores
  const userProfile = useUserProfile();
  const healthData = useHealthData();
  const preferences = useUserPreferences();
  const isLoadingProfile = useIsLoadingProfile();
  const isLoadingPreferences = useIsLoadingPreferences();
  const { updatePreferences, signOut, fetchUserProfile, updateUserProfile } = useUserStore();
  
  // Theme store
  const { toggleTheme } = useThemeStore();
  const isDarkMode = useIsDarkMode();
  const colors = useThemeColors();
  
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWearableConnectionModal, setShowWearableConnectionModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    loadPatientData();
    loadConnectedDevices();
    loadProfileImage();
  }, [userProfile]);

  const loadPatientData = async () => {
    try {
      if (!userProfile) return;

      const patientData = await getPatientProfile(userProfile.id);
      setPatientProfile(patientData);
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const loadConnectedDevices = async () => {
    try {
      if (preferences?.wearableConnected) {
        setConnectedDevices(['Health App']);
      } else {
        setConnectedDevices([]);
      }
    } catch (error) {
      console.error('Error loading connected devices:', error);
    }
  };

  const loadProfileImage = () => {
    if (userProfile?.profile_image_url) {
      setProfileImage(userProfile.profile_image_url);
    }
  };

  const updateNotificationPreference = async (key: keyof typeof preferences.notifications, value: boolean) => {
    if (!preferences || !userProfile) return;

    const updatedNotifications = {
      ...preferences.notifications,
      [key]: value,
    };

    try {
      await updatePreferences({ 
        notifications: updatedNotifications 
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      Alert.alert('Error', 'Failed to update preference. Please try again.');
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Show action sheet
      Alert.alert(
        'Select Profile Image',
        'Choose how you want to select your profile image',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Camera', onPress: () => openCamera() },
          { text: 'Photo Library', onPress: () => openImageLibrary() },
        ]
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const openCamera = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', 'Failed to open image library');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    if (!userProfile) return;

    setLoading(true);
    try {
      // Create a unique filename
      const fileExt = imageUri.split('.').pop();
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;

      // Convert image to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update user profile with image URL
      await updateUserProfile({
        profile_image_url: publicUrl,
      });

      setProfileImage(publicUrl);
      Alert.alert('Success', 'Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Error', 'Failed to upload profile image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWearable = async () => {
    if (!userProfile) return;

    Alert.alert(
      'Connect Health App',
      'Would you like to enable health data tracking?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enable Health Tracking', 
          onPress: async () => {
            try {
              await updatePreferences({ wearableConnected: true });
              setConnectedDevices(['Health App']);
              Alert.alert('Success', 'Health tracking enabled successfully!');
            } catch (error) {
              console.error('Error enabling health tracking:', error);
              Alert.alert('Error', 'Failed to enable health tracking. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleDisconnectWearable = (deviceName: string) => {
    Alert.alert(
      'Disconnect Health Tracking',
      `Are you sure you want to disconnect ${deviceName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await updatePreferences({ wearableConnected: false });
              setConnectedDevices([]);
              Alert.alert('Success', 'Health tracking disconnected successfully');
            } catch (error) {
              console.error('Error disconnecting health tracking:', error);
              Alert.alert('Error', 'Failed to disconnect health tracking');
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
              await signOut();
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
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.background }]}>
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
    <TouchableOpacity style={[styles.profileItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <View style={[styles.profileItemIcon, { backgroundColor: colors.surface }]}> 
          <Icon color={colors.textSecondary} size={20} />
        </View>
        <View>
          <Text style={[styles.profileItemTitle, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.profileItemSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
        </View>
      </View>
        {rightElement}
    </TouchableOpacity>
  );

  if (loading || !userProfile || !preferences || isLoadingProfile || isLoadingPreferences) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <WearableConnectionModal visible={showWearableConnectionModal} onConnect={handleConnectWearable} onDismiss={() => setShowWearableConnectionModal(false)} />
      
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/stats')} style={[styles.homeButton, { backgroundColor: colors.background }]}>
            <Home color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
      </Animated.View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInUp.duration(600)} style={styles.profileHeaderSection}>
            <View style={styles.profileHeader}>
              <TouchableOpacity onPress={handleImagePicker} style={styles.avatarContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <User color="white" size={32} />
                  </View>
                )}
                <View style={[styles.cameraIcon, { backgroundColor: colors.primary }]}>
                  <Camera color="white" size={16} />
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {userProfile.first_name} {userProfile.last_name}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userProfile.email}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowEditModal(true)}
              >
                <Edit color="white" size={20} />
              </TouchableOpacity>
            </View>
        </Animated.View>

        
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <ProfileSection title="Health Goals">
            <ProfileItem
              icon={Target}
              title="Daily Steps"
              subtitle={`${healthData.HealthGoals.steps.toLocaleString()} steps`}
              onPress={() => {}}
            />
            <ProfileItem
              icon={Heart}
              title="Calories Goal"
              subtitle={`${healthData.HealthGoals.calories} kcal`}
              onPress={() => {}}
            />
            <ProfileItem
              icon={Activity}
              title="Active Minutes"
              subtitle={`${healthData.HealthGoals.activeMinutes} minutes`}
              onPress={() => {}}
            />
          </ProfileSection>
        </Animated.View>

        
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <ProfileSection title="Health Tracking">
            {connectedDevices.length > 0 ? (
              connectedDevices.map((deviceName) => (
                <ProfileItem
                  key={deviceName}
                  icon={Smartphone}
                  title={deviceName}
                  subtitle="Connected"
                  onPress={() => handleDisconnectWearable(deviceName)}
                />
              ))
            ) : (
              <ProfileItem
                icon={Plus}
                title="Enable Health Tracking"
                subtitle="Track your health metrics and activities"
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
                  trackColor={{ false: colors.border, true: colors.primary }}
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
                  trackColor={{ false: colors.border, true: colors.primary }}
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
                  trackColor={{ false: colors.border, true: colors.primary }}
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
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="white"
                />
              }
            />
          </ProfileSection>
        </Animated.View>

        
        <Animated.View entering={FadeInUp.delay(800).duration(600)}>
          <ProfileSection title="Settings">
            <ProfileItem
              icon={isDarkMode ? Sun : Moon}
              title="Dark Mode"
              subtitle={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              rightElement={
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="white"
                />
              }
            />
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

        
        <Animated.View entering={FadeInUp.delay(1000).duration(600)} style={[styles.disclaimer, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <Text style={[styles.disclaimerTitle, { color: colors.warning }]}>Medical Disclaimer</Text>
          <Text style={[styles.disclaimerText, { color: colors.warning }]}>
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
        onSave={fetchUserProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12, // Reduced padding
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeButton: {
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
  placeholder: {
    width: 40,
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
  },
  profileHeaderSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 12,
  },
  sectionContent: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  profileItemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  disclaimer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});