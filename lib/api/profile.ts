import { supabase } from '../supabase';
import { UserPreferences, defaultPreferences } from '../storage';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: string;
  profile_image_url?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  medical_record_number?: string;
  ethnicity?: string;
  race?: string;
  preferred_language?: string;
  marital_status?: string;
  occupation?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  insurance_subscriber_id?: string;
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  family_medical_history?: string;
  height_inches?: number;
  weight_pounds?: number;
  preferred_provider_gender?: string;
  communication_preferences?: any;
  appointment_reminder_preferences?: any;
}

export interface HealthGoal {
  id: string;
  user_id: string;
  goal_type: 'steps' | 'calories' | 'active_minutes' | 'sleep_hours' | 'weight' | 'hydration';
  target_value: number;
  current_streak: number;
  best_streak: number;
  is_active: boolean;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function getPatientProfile(userId: string): Promise<PatientProfile | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching patient profile:', error);
    return null;
  }

  return data;
}

export async function createOrUpdatePatientProfile(userId: string, patientData: Partial<PatientProfile>): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .upsert({ user_id: userId, ...patientData }, { onConflict: 'user_id' });

  if (error) {
    console.error('Error creating/updating patient profile:', error);
    throw error;
  }
}

export async function getHealthGoals(userId: string): Promise<HealthGoal[]> {
  const { data, error } = await supabase
    .from('health_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching health goals:', error);
    throw error;
  }

  return data || [];
}

export async function updateHealthGoal(userId: string, goalType: string, targetValue: number): Promise<void> {
  const { error } = await supabase
    .from('health_goals')
    .upsert({
      user_id: userId,
      goal_type: goalType,
      target_value: targetValue,
      is_active: true,
    }, { onConflict: 'user_id,goal_type' });

  if (error) {
    console.error('Error updating health goal:', error);
    throw error;
  }
}

export async function logSymptom(userId: string, symptomName: string, severity: number, description?: string): Promise<void> {
  const { error } = await supabase
    .from('symptom_logs')
    .insert({
      user_id: userId,
      symptom_name: symptomName,
      severity,
      description,
    });

  if (error) {
    console.error('Error logging symptom:', error);
    throw error;
  }
}

export async function logMedication(userId: string, medicationName: string, dosage?: string, notes?: string): Promise<void> {
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
    console.error('Error logging medication:', error);
    throw error;
  }
}

export async function getUserPreferencesFromDB(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      notification_achievements,
      notification_health_alerts,
      notification_medications,
      notification_appointments
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user preferences from DB:', error);
    throw error;
  }

  if (!data) {
    return defaultPreferences;
  }

  // Convert DB format to app format
  return {
    notifications: {
      achievements: data.notification_achievements ?? defaultPreferences.notifications.achievements,
      healthAlerts: data.notification_health_alerts ?? defaultPreferences.notifications.healthAlerts,
      medications: data.notification_medications ?? defaultPreferences.notifications.medications,
      appointments: data.notification_appointments ?? defaultPreferences.notifications.appointments
    },
  };
}

export async function updateUserPreferencesInDB(userId: string, preferences: UserPreferences): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      notification_achievements: preferences.notifications.achievements,
      notification_health_alerts: preferences.notifications.healthAlerts,
      notification_medications: preferences.notifications.medications,
      notification_appointments: preferences.notifications.appointments
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user preferences in DB:', error);
    throw error;
  }
}

export interface CachedHealthData {
  steps: number;
  heartRate: number | null;
  calories: number;
  sleep: number | null;
  activeMinutes: number;
  distance: number; // in meters
  weight: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  lastUpdated: string | null;
}

export async function getCachedHealthData(userId: string): Promise<CachedHealthData | null> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      current_steps,
      current_heart_rate,
      current_calories,
      current_sleep_hours,
      current_active_minutes,
      current_distance_meters,
      current_weight_kg,
      current_blood_pressure_systolic,
      current_blood_pressure_diastolic,
      health_data_last_updated
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching cached health data:', error);
    throw error;
  }

  if (!data) return null;

  return {
    steps: data.current_steps || 0,
    heartRate: data.current_heart_rate,
    calories: data.current_calories || 0,
    sleep: data.current_sleep_hours,
    activeMinutes: data.current_active_minutes || 0,
    distance: data.current_distance_meters || 0,
    weight: data.current_weight_kg,
    bloodPressureSystolic: data.current_blood_pressure_systolic,
    bloodPressureDiastolic: data.current_blood_pressure_diastolic,
    lastUpdated: data.health_data_last_updated
  };
}

export async function updateCachedHealthData(userId: string, healthData: Partial<CachedHealthData>): Promise<void> {
  const updateData: any = {
    health_data_last_updated: new Date().toISOString()
  };

  if (healthData.steps !== undefined) updateData.current_steps = healthData.steps;
  if (healthData.heartRate !== undefined) updateData.current_heart_rate = healthData.heartRate;
  if (healthData.calories !== undefined) updateData.current_calories = healthData.calories;
  if (healthData.sleep !== undefined) updateData.current_sleep_hours = healthData.sleep;
  if (healthData.activeMinutes !== undefined) updateData.current_active_minutes = healthData.activeMinutes;
  if (healthData.distance !== undefined) updateData.current_distance_meters = healthData.distance;
  if (healthData.weight !== undefined) updateData.current_weight_kg = healthData.weight;
  if (healthData.bloodPressureSystolic !== undefined) updateData.current_blood_pressure_systolic = healthData.bloodPressureSystolic;
  if (healthData.bloodPressureDiastolic !== undefined) updateData.current_blood_pressure_diastolic = healthData.bloodPressureDiastolic;

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating cached health data:', error);
    throw error;
  }
}