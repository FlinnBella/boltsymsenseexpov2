import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPreferences {
  wearableConnected: boolean;
  wearablePromptDismissed: boolean;
  dashboard_layout: string;
  notifications: {
    achievements: boolean;
    healthAlerts: boolean;
    medications: boolean;
    appointments: boolean;
  };
}

export const defaultPreferences: UserPreferences = {
  wearableConnected: false,
  wearablePromptDismissed: false,
  dashboard_layout: 'default',
  notifications: {
    achievements: true,
    healthAlerts: true,
    medications: true,
    appointments: true,
  },
};

export interface HealthLocalData {
  healthGoals: {
    steps: number;
    calories: number;
  };
  healthData: {
    steps: number;
    calories: number;
    distance: number;
    active_minutes: number;
  sleep: number;
};
}

export async function saveUserPreferences(preferences: UserPreferences) {
  try {
    await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const stored = await AsyncStorage.getItem('userPreferences');
    return stored ? JSON.parse(stored) : defaultPreferences;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return defaultPreferences;
  }
}

export async function clearUserPreferences(): Promise<void> {
  try {
    await AsyncStorage.removeItem('userPreferences');
  } catch (error) {
    console.error('Error clearing preferences:', error);
  }
}

export async function saveHealthData(data: HealthLocalData) {
  try {
    const existing = await AsyncStorage.getItem('healthLocalData');
    const healthLocalData = existing ? JSON.parse(existing) : [];
    healthLocalData.push({ ...data, timestamp: new Date().toISOString() });
    await AsyncStorage.setItem('healthLocalData', JSON.stringify(healthLocalData));
  } catch (error) {
    console.error('Error saving health data:', error);
  }
}

export async function getHealthLocalData() {
  try {
    const stored = await AsyncStorage.getItem('healthLocalData');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading health local data:', error);
    return [];
  }
}