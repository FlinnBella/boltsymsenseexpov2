import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPreferences {
  notifications: {
    achievements: boolean;
    healthAlerts: boolean;
    medications: boolean;
    appointments: boolean;
  };
}

export const defaultPreferences: UserPreferences = {
  notifications: {
    achievements: true,
    healthAlerts: true,
    medications: true,
    appointments: true,
  },
};

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

export async function saveHealthData(data: any) {
  try {
    const existing = await AsyncStorage.getItem('healthData');
    const healthData = existing ? JSON.parse(existing) : [];
    healthData.push({ ...data, timestamp: new Date().toISOString() });
    await AsyncStorage.setItem('healthData', JSON.stringify(healthData));
  } catch (error) {
    console.error('Error saving health data:', error);
  }
}

export async function getHealthData() {
  try {
    const stored = await AsyncStorage.getItem('healthData');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading health data:', error);
    return [];
  }
}