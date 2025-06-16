import { supabase } from '../supabase';

const TERRA_API_KEY = process.env.EXPO_PUBLIC_TERRA_API_KEY!;
const TERRA_DEV_ID = process.env.EXPO_PUBLIC_TERRA_DEV_ID!;
const TERRA_BASE_URL = 'https://api.tryterra.co/v2';

export interface TerraUser {
  user_id: string;
  provider: string;
  last_webhook_update: string;
}

export interface BiometricData {
  date: string;
  steps?: number;
  calories_burned?: number;
  distance_meters?: number;
  active_minutes?: number;
  heart_rate_avg?: number;
  heart_rate_min?: number;
  heart_rate_max?: number;
  heart_rate_resting?: number;
  sleep_hours?: number;
  sleep_quality_score?: number;
  weight_kg?: number;
  body_fat_percentage?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  blood_oxygen_percentage?: number;
  stress_level?: number;
  hydration_ml?: number;
}

export interface TerraConnection {
  id: string;
  user_id: string;
  terra_user_id: string;
  provider: string;
  reference_id: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

class TerraAPI {
  private headers = {
    'dev-id': TERRA_DEV_ID,
    'X-API-Key': TERRA_API_KEY,
    'Content-Type': 'application/json',
  };

  async generateAuthURL(provider: string, reference_id: string): Promise<{ auth_url: string; user_id: string }> {
    try {
      const response = await fetch(`${TERRA_BASE_URL}/auth/generateAuthURL`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          reference_id,
          providers: provider,
          auth_success_redirect_url: 'myapp://auth/success',
          auth_failure_redirect_url: 'myapp://auth/failure',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Terra API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw error;
    }
  }

  async getUsers(): Promise<TerraUser[]> {
    try {
      const response = await fetch(`${TERRA_BASE_URL}/users`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Terra API error: ${response.status}`);
      }

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getDailyData(user_id: string, start_date: string, end_date: string): Promise<any> {
    try {
      const response = await fetch(
        `${TERRA_BASE_URL}/daily/${user_id}?start_date=${start_date}&end_date=${end_date}`,
        {
          headers: this.headers,
        }
      );
      
      if (!response.ok) {
        throw new Error(`Terra API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching daily data:', error);
      throw error;
    }
  }

  async getBodyData(user_id: string, start_date: string, end_date: string): Promise<any> {
    try {
      const response = await fetch(
        `${TERRA_BASE_URL}/body/${user_id}?start_date=${start_date}&end_date=${end_date}`,
        {
          headers: this.headers,
        }
      );
      
      if (!response.ok) {
        throw new Error(`Terra API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching body data:', error);
      throw error;
    }
  }

  async getSleepData(user_id: string, start_date: string, end_date: string): Promise<any> {
    try {
      const response = await fetch(
        `${TERRA_BASE_URL}/sleep/${user_id}?start_date=${start_date}&end_date=${end_date}`,
        {
          headers: this.headers,
        }
      );
      
      if (!response.ok) {
        throw new Error(`Terra API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      throw error;
    }
  }

  async deauthUser(user_id: string): Promise<void> {
    try {
      const response = await fetch(`${TERRA_BASE_URL}/auth/deauthUser`, {
        method: 'DELETE',
        headers: this.headers,
        body: JSON.stringify({ user_id }),
      });
      
      if (!response.ok) {
        throw new Error(`Terra API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deauthorizing user:', error);
      throw error;
    }
  }
}

export const terraAPI = new TerraAPI();

// Database operations for Terra connections
export async function saveTerraConnection(connection: Omit<TerraConnection, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabase
    .from('terra_connections')
    .upsert(connection, { onConflict: 'user_id,provider' });

  if (error) {
    console.error('Error saving Terra connection:', error);
    throw error;
  }
}

export async function getTerraConnections(userId: string): Promise<TerraConnection[]> {
  const { data, error } = await supabase
    .from('terra_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching Terra connections:', error);
    throw error;
  }

  return data || [];
}

export async function updateTerraConnectionSync(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('terra_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', connectionId);

  if (error) {
    console.error('Error updating Terra connection sync:', error);
    throw error;
  }
}

export async function deactivateTerraConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('terra_connections')
    .update({ is_active: false })
    .eq('id', connectionId);

  if (error) {
    console.error('Error deactivating Terra connection:', error);
    throw error;
  }
}

// Biometric data operations
export async function saveBiometricData(userId: string, data: BiometricData): Promise<void> {
  const biometricRecord = {
    user_id: userId,
    ...data,
  };

  const { error } = await supabase
    .from('user_biometric_data')
    .upsert(biometricRecord, { onConflict: 'user_id,date' });

  if (error) {
    console.error('Error saving biometric data:', error);
    throw error;
  }
}

export async function getBiometricData(userId: string, startDate: string, endDate: string): Promise<BiometricData[]> {
  const { data, error } = await supabase
    .from('user_biometric_data')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching biometric data:', error);
    throw error;
  }

  return data || [];
}

export async function getLatestBiometricData(userId: string): Promise<BiometricData | null> {
  const { data, error } = await supabase
    .from('user_biometric_data')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest biometric data:', error);
    throw error;
  }

  return data;
}

// Sync Terra data to local database
export async function syncTerraData(userId: string): Promise<void> {
  try {
    const connections = await getTerraConnections(userId);
    
    if (connections.length === 0) {
      throw new Error('No Terra connections found');
    }

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const connection of connections) {
      try {
        // Fetch daily data
        const dailyData = await terraAPI.getDailyData(connection.terra_user_id, sevenDaysAgo, today);
        
        // Process and save daily data
        if (dailyData.data && dailyData.data.length > 0) {
          for (const dayData of dailyData.data) {
            const biometricData: BiometricData = {
              date: dayData.metadata?.date || today,
              steps: dayData.distance?.steps,
              calories_burned: dayData.calories?.total_burned,
              distance_meters: dayData.distance?.distance_meters,
              active_minutes: dayData.active_durations?.activity_seconds ? Math.round(dayData.active_durations.activity_seconds / 60) : undefined,
              heart_rate_avg: dayData.heart_rate?.avg_hr_bpm,
              heart_rate_min: dayData.heart_rate?.min_hr_bpm,
              heart_rate_max: dayData.heart_rate?.max_hr_bpm,
              heart_rate_resting: dayData.heart_rate?.resting_hr_bpm,
            };

            await saveBiometricData(userId, biometricData);
          }
        }

        // Fetch sleep data
        const sleepData = await terraAPI.getSleepData(connection.terra_user_id, sevenDaysAgo, today);
        
        if (sleepData.data && sleepData.data.length > 0) {
          for (const sleepDay of sleepData.data) {
            const sleepBiometricData: BiometricData = {
              date: sleepDay.metadata?.date || today,
              sleep_hours: sleepDay.sleep_durations?.total_sleep_duration_seconds ? sleepDay.sleep_durations.total_sleep_duration_seconds / 3600 : undefined,
              sleep_quality_score: sleepDay.sleep_efficiency?.sleep_efficiency_percentage,
            };

            await saveBiometricData(userId, sleepBiometricData);
          }
        }

        // Update sync timestamp
        await updateTerraConnectionSync(connection.id);
      } catch (error) {
        console.error(`Error syncing data for connection ${connection.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error syncing Terra data:', error);
    throw error;
  }
}