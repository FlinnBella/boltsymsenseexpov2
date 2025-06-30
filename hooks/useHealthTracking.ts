import { useState, useEffect, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeHealthKit,
  initializeHealthConnect,
  requestHealthPermissions,
  getHealthData,
  getHistoricalHealthData,
  performBackgroundSync,
  retryQueuedSyncs,
  isHealthDataAvailable,
  getHealthPermissionsStatus,
  HealthMetric,
  WeeklyHealthData,
} from '@/lib/healthKit';
import { useUserProfile } from '@/stores/useUserStore';

interface HealthTrackingState {
  isInitialized: boolean;
  hasPermissions: boolean;
  showPermissionModal: boolean;
  currentData: HealthMetric | null;
  historicalData: WeeklyHealthData | null;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

export function useHealthTracking() {
  const userProfile = useUserProfile();
  const appState = useRef(AppState.currentState);
  
  const [state, setState] = useState<HealthTrackingState>({
    isInitialized: false,
    hasPermissions: false,
    showPermissionModal: false,
    currentData: null,
    historicalData: null,
    isLoading: false,
    error: null,
    lastSyncTime: null,
  });

  // Initialize health tracking on mount
  useEffect(() => {
    initializeHealthTracking();
  }, []);

  // Listen for app state changes for background sync
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        state.hasPermissions &&
        userProfile
      ) {
        // App has come to the foreground, perform sync
        performSync();
        retryQueuedSyncs();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [state.hasPermissions, userProfile]);

  // Auto-sync every 5 minutes when app is active
  useEffect(() => {
    if (!state.hasPermissions || !userProfile) return;

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        performSync();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [state.hasPermissions, userProfile]);

  const initializeHealthTracking = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if health data is available on this platform
      if (!isHealthDataAvailable()) {
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          error: 'Health tracking not available on this platform',
        }));
        return;
      }

      // Check if user has previously denied permissions
      const hasDeclinedPermissions = await AsyncStorage.getItem('health_permissions_declined');
      if (hasDeclinedPermissions === 'true') {
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
        }));
        return;
      }

      // Initialize platform-specific health service
      let initialized = false;
      if (Platform.OS === 'ios') {
        initialized = await initializeHealthKit();
      } else if (Platform.OS === 'android') {
        initialized = await initializeHealthConnect();
      }

      if (!initialized) {
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          error: 'Failed to initialize health service',
        }));
        return;
      }

      // Check current permissions
      const permissions = await getHealthPermissionsStatus();
      const hasAllPermissions = Object.values(permissions).every(Boolean);

      if (!hasAllPermissions) {
        // Show permission modal if not all permissions are granted
        setState(prev => ({
          ...prev,
          isInitialized: true,
          showPermissionModal: true,
          isLoading: false,
        }));
      } else {
        // Permissions already granted, start tracking
        setState(prev => ({
          ...prev,
          isInitialized: true,
          hasPermissions: true,
          isLoading: false,
        }));
        
        // Load initial data
        await loadHealthData();
      }
    } catch (error) {
      console.error('Error initializing health tracking:', error);
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        error: 'Failed to initialize health tracking',
      }));
    }
  };

  const requestPermissions = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, showPermissionModal: false }));

      const granted = await requestHealthPermissions();
      
      if (granted) {
        setState(prev => ({
          ...prev,
          hasPermissions: true,
          isLoading: false,
        }));
        
        // Load initial data after permissions granted
        await loadHealthData();
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Health permissions denied',
        }));
      }
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to request health permissions',
      }));
    }
  };

  const denyPermissions = async () => {
    try {
      // Remember that user declined permissions
      await AsyncStorage.setItem('health_permissions_declined', 'true');
      
      setState(prev => ({
        ...prev,
        showPermissionModal: false,
      }));
    } catch (error) {
      console.error('Error saving permission decline:', error);
    }
  };

  const loadHealthData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Load current health data
      const currentData = await getHealthData();
      
      // Load historical data (last 30 days)
      const historicalData = await getHistoricalHealthData(30);

      setState(prev => ({
        ...prev,
        currentData,
        historicalData,
        isLoading: false,
        lastSyncTime: new Date(),
      }));

      // Sync to Supabase if user is logged in
      if (userProfile) {
        await performBackgroundSync(userProfile.id);
      }
    } catch (error) {
      console.error('Error loading health data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load health data',
      }));
    }
  };

  const performSync = async () => {
    if (!userProfile || !state.hasPermissions) return;

    try {
      await performBackgroundSync(userProfile.id);
      
      // Refresh current data after sync
      const currentData = await getHealthData();
      setState(prev => ({
        ...prev,
        currentData,
        lastSyncTime: new Date(),
      }));
    } catch (error) {
      console.error('Error performing sync:', error);
      // Don't update error state for background sync failures
    }
  };

  const refreshData = async () => {
    if (!state.hasPermissions) return;
    await loadHealthData();
  };

  const retryPermissions = async () => {
    // Clear the declined flag and show permission modal again
    await AsyncStorage.removeItem('health_permissions_declined');
    setState(prev => ({
      ...prev,
      showPermissionModal: true,
      error: null,
    }));
  };

  return {
    ...state,
    requestPermissions,
    denyPermissions,
    refreshData,
    retryPermissions,
    isAvailable: isHealthDataAvailable(),
  };
}