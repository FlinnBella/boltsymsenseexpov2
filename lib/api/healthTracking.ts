import { supabase } from '../supabase';

export interface SymptomLog {
  id: string;
  user_id: string;
  symptom_name: string;
  severity: number;
  description?: string;
  logged_at: string;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  user_id: string;
  medication_name: string;
  dosage?: string;
  taken_at: string;
  notes?: string;
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  food_name: string;
  negative_effects?: string;
  consumed_at: string;
  created_at: string;
}

export interface HealthDataCache {
  id: string;
  user_id: string;
  steps: number;
  heart_rate_avg?: number;
  calories: number;
  sleep?: number;
  distance: number;
  active_minutes: number;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  wearable_connected: boolean;
  wearable_prompt_dismissed: boolean;
  notification_preferences: {
    achievements: boolean;
    healthAlerts: boolean;
    medications: boolean;
    appointments: boolean;
  };
  created_at: string;
  updated_at: string;
}

// Symptom Logs
export async function getSymptomLogs(userId: string, limit = 50): Promise<SymptomLog[]> {
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching symptom logs:', error);
    throw error;
  }

  return data || [];
}

export async function createSymptomLog(
  userId: string,
  symptomName: string,
  severity: number,
  description?: string
): Promise<void> {
  const { error } = await supabase
    .from('symptom_logs')
    .insert({
      user_id: userId,
      symptom_name: symptomName,
      severity,
      description,
    });

  if (error) {
    console.error('Error creating symptom log:', error);
    throw error;
  }
}

// Medication Logs
export async function getMedicationLogs(userId: string, limit = 50): Promise<MedicationLog[]> {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching medication logs:', error);
    throw error;
  }

  return data || [];
}

export async function createMedicationLog(
  userId: string,
  medicationName: string,
  dosage?: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('medication_logs')
    .insert({
      user_id: userId,
      medication_name: medicationName,
      dosage,
      taken_at: new Date().toISOString(),
      notes,
    });

  if (error) {
    console.error('Error creating medication log:', error);
    throw error;
  }
}

// Food Logs
export async function getFoodLogs(userId: string, limit = 50): Promise<FoodLog[]> {
  const { data, error } = await supabase
    .from('food_logs_cache')
    .select('*')
    .eq('user_id', userId)
    .order('consumed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching food logs:', error);
    throw error;
  }

  return data || [];
}

export async function createFoodLog(
  userId: string,
  foodName: string,
  negativeEffects?: string
): Promise<void> {
  const { error } = await supabase
    .from('food_logs_cache')
    .insert({
      user_id: userId,
      food_name: foodName,
      negative_effects: negativeEffects,
    });

  if (error) {
    console.error('Error creating food log:', error);
    throw error;
  }
}

// User Preferences
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user preferences:', error);
    throw error;
  }

  return data;
}

export async function createOrUpdateUserPreferences(
  userId: string,
  preferences: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

export async function updateWearableStatus(userId: string, connected: boolean): Promise<void> {
  await createOrUpdateUserPreferences(userId, {
    wearable_connected: connected,
  });
}

export async function dismissWearablePrompt(userId: string): Promise<void> {
  await createOrUpdateUserPreferences(userId, {
    wearable_prompt_dismissed: true,
  });
}