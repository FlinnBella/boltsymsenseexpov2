import { supabase } from '../supabase';

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