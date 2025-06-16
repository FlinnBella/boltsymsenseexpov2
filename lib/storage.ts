import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPreferences {
  dashboardLayout: string[];
  healthGoals: {
    steps: number;
    calories: number;
    activeMinutes: number;
    sleepHours: number;
  };
  notifications: {
    achievements: boolean;
    healthAlerts: boolean;
    medications: boolean;
    appointments: boolean;
  };
}

export const defaultPreferences: UserPreferences = {
  dashboardLayout: ['steps', 'heartRate', 'calories', 'sleep'],
  healthGoals: {
    steps: 10000,
    calories: 2000,
    activeMinutes: 30,
    sleepHours: 8,
  },
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