import { Platform } from 'react-native';
import { supabase } from './supabase';

// Health data interface
export interface HealthMetric {
  steps?: number;
  calories?: number;
  heartRate?: number;
  distance?: number;
  activeMinutes?: number;
  sleep?: number;
  weight?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
}

export interface HealthDataPoint {
  value: number;
  date: string;
  source?: string;
}

export interface WeeklyHealthData {
  [key: string]: HealthDataPoint[];
}

// Mock health data for development and web platform
const generateMockHealthData = (): HealthMetric => {
  const baseSteps = 8000 + Math.random() * 4000;
  const baseCalories = 1800 + Math.random() * 600;
  const baseHeartRate = 65 + Math.random() * 20;
  
  return {
    steps: Math.round(baseSteps),
    calories: Math.round(baseCalories),
    heartRate: Math.round(baseHeartRate),
    distance: Math.round((baseSteps * 0.0008) * 100) / 100, // Rough conversion to km
    activeMinutes: Math.round(30 + Math.random() * 60),
    sleep: Math.round((7 + Math.random() * 2) * 10) / 10, // 7-9 hours
    weight: Math.round((70 + Math.random() * 20) * 10) / 10, // 70-90 kg
    bloodPressure: {
      systolic: Math.round(110 + Math.random() * 30), // 110-140
      diastolic: Math.round(70 + Math.random() * 20), // 70-90
    },
  };
};

// Generate mock weekly data
const generateMockWeeklyData = (days: number = 30): WeeklyHealthData => {
  const data: WeeklyHealthData = {
    steps: [],
    calories: [],
    heartRate: [],
    distance: [],
    activeMinutes: [],
    sleep: [],
    weight: [],
  };

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const mockData = generateMockHealthData();
    
    data.steps.push({ value: mockData.steps || 0, date: dateStr, source: 'mock' });
    data.calories.push({ value: mockData.calories || 0, date: dateStr, source: 'mock' });
    data.heartRate.push({ value: mockData.heartRate || 0, date: dateStr, source: 'mock' });
    data.distance.push({ value: mockData.distance || 0, date: dateStr, source: 'mock' });
    data.activeMinutes.push({ value: mockData.activeMinutes || 0, date: dateStr, source: 'mock' });
    data.sleep.push({ value: mockData.sleep || 0, date: dateStr, source: 'mock' });
    data.weight.push({ value: mockData.weight || 0, date: dateStr, source: 'mock' });
  }

  return data;
};

// Initialize HealthKit (iOS only)
export const initializeHealthKit = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    console.log('HealthKit is only available on iOS');
    return false;
  }

  try {
    // For now, we'll simulate HealthKit availability
    // In a real implementation, you would use react-native-health here
    console.log('HealthKit initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize HealthKit:', error);
    return false;
  }
};

// Initialize Health Connect (Android only)
export const initializeHealthConnect = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    console.log('Health Connect is only available on Android');
    return false;
  }

  try {
    // For now, we'll simulate Health Connect availability
    // In a real implementation, you would use Health Connect SDK
    console.log('Health Connect initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Health Connect:', error);
    return false;
  }
};

// Request health permissions
export const requestHealthPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // Simulate iOS HealthKit permission request
      console.log('iOS HealthKit permissions requested');
      return true;
    } else if (Platform.OS === 'android') {
      // Simulate Android Health Connect permission request
      console.log('Android Health Connect permissions requested');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to request health permissions:', error);
    return false;
  }
};

// Get health data from HealthKit or Health Connect
export const getHealthData = async (): Promise<HealthMetric> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS HealthKit implementation
      return await getHealthKitData();
    } else if (Platform.OS === 'android') {
      // Android Health Connect implementation
      return await getHealthConnectData();
    } else {
      // Web or other platforms - return mock data
      return generateMockHealthData();
    }
  } catch (error) {
    console.error('Error fetching health data:', error);
    return generateMockHealthData();
  }
};

// iOS HealthKit data fetching
const getHealthKitData = async (): Promise<HealthMetric> => {
  try {
    // For now, return mock data
    // In a real implementation, you would use react-native-health to fetch actual data
    
    /*
    Example implementation with react-native-health:
    
    import { AppleHealthKit, HealthValue, HealthKitPermissions } from 'react-native-health';
    
    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.Weight,
          AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
          AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
        ],
      },
    } as HealthKitPermissions;

    const options = {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      endDate: new Date().toISOString(),
    };

    const steps = await new Promise<number>((resolve) => {
      AppleHealthKit.getStepCount(options, (callbackError: string, results: HealthValue) => {
        resolve(results?.value || 0);
      });
    });

    const calories = await new Promise<number>((resolve) => {
      AppleHealthKit.getActiveEnergyBurned(options, (callbackError: string, results: HealthValue[]) => {
        const total = results?.reduce((sum, item) => sum + item.value, 0) || 0;
        resolve(total);
      });
    });

    return { steps, calories, heartRate: 72 };
    */

    return generateMockHealthData();
  } catch (error) {
    console.error('Error fetching HealthKit data:', error);
    return generateMockHealthData();
  }
};

// Android Health Connect data fetching
const getHealthConnectData = async (): Promise<HealthMetric> => {
  try {
    // For now, return mock data
    // In a real implementation, you would use Health Connect APIs
    
    /*
    Example implementation with Health Connect:
    
    // You would need to implement Health Connect integration
    // This typically involves using the Health Connect SDK for React Native
    // or creating a native module to interface with Health Connect
    */

    return generateMockHealthData();
  } catch (error) {
    console.error('Error fetching Health Connect data:', error);
    return generateMockHealthData();
  }
};

// Get historical health data for charts
export const getHistoricalHealthData = async (days: number = 30): Promise<WeeklyHealthData> => {
  try {
    if (Platform.OS === 'ios') {
      return await getHistoricalHealthKitData(days);
    } else if (Platform.OS === 'android') {
      return await getHistoricalHealthConnectData(days);
    } else {
      return generateMockWeeklyData(days);
    }
  } catch (error) {
    console.error('Error fetching historical health data:', error);
    return generateMockWeeklyData(days);
  }
};

// iOS HealthKit historical data
const getHistoricalHealthKitData = async (days: number): Promise<WeeklyHealthData> => {
  try {
    // For now, return mock data
    // In a real implementation, you would fetch historical data from HealthKit
    return generateMockWeeklyData(days);
  } catch (error) {
    console.error('Error fetching historical HealthKit data:', error);
    return generateMockWeeklyData(days);
  }
};

// Android Health Connect historical data
const getHistoricalHealthConnectData = async (days: number): Promise<WeeklyHealthData> => {
  try {
    // For now, return mock data
    // In a real implementation, you would fetch historical data from Health Connect
    return generateMockWeeklyData(days);
  } catch (error) {
    console.error('Error fetching historical Health Connect data:', error);
    return generateMockWeeklyData(days);
  }
};

// Sync health data to Supabase
export const syncHealthDataToSupabase = async (
  userId: string,
  healthData: HealthMetric
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('health_data_cache')
      .upsert({
        user_id: userId,
        steps: healthData.steps || 0,
        heart_rate_avg: healthData.heartRate || null,
        calories: healthData.calories || 0,
        sleep: healthData.sleep || null,
        distance: healthData.distance || 0,
        active_minutes: healthData.activeMinutes || 0,
        created_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    console.log('Health data synced to Supabase successfully');
  } catch (error) {
    console.error('Error syncing health data to Supabase:', error);
    throw error;
  }
};

// Check if health data is available
export const isHealthDataAvailable = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

// Get health data permissions status
export const getHealthPermissionsStatus = async (): Promise<{
  steps: boolean;
  calories: boolean;
  heartRate: boolean;
  sleep: boolean;
  weight: boolean;
}> => {
  try {
    // For now, return mock permissions
    // In a real implementation, you would check actual permissions
    return {
      steps: true,
      calories: true,
      heartRate: true,
      sleep: true,
      weight: true,
    };
  } catch (error) {
    console.error('Error checking health permissions:', error);
    return {
      steps: false,
      calories: false,
      heartRate: false,
      sleep: false,
      weight: false,
    };
  }
};

// Background sync function
export const performBackgroundSync = async (userId: string): Promise<void> => {
  try {
    console.log('Performing background health data sync...');
    
    // Get current health data
    const healthData = await getHealthData();
    
    // Sync to Supabase
    await syncHealthDataToSupabase(userId, healthData);
    
    console.log('Background sync completed successfully');
  } catch (error) {
    console.error('Background sync failed:', error);
    // Store failed sync for retry when online
    await queueFailedSync(userId, error);
  }
};

// Queue failed sync for retry
const queueFailedSync = async (userId: string, error: any): Promise<void> => {
  try {
    // In a real implementation, you would store this in AsyncStorage
    // for retry when the app comes back online
    console.log('Queuing failed sync for retry:', { userId, error: error.message });
  } catch (queueError) {
    console.error('Failed to queue sync for retry:', queueError);
  }
};

// Retry queued syncs
export const retryQueuedSyncs = async (): Promise<void> => {
  try {
    // In a real implementation, you would retrieve queued syncs from AsyncStorage
    // and attempt to sync them again
    console.log('Retrying queued syncs...');
  } catch (error) {
    console.error('Failed to retry queued syncs:', error);
  }
};