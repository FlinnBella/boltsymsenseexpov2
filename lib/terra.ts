const TERRA_API_KEY = process.env.EXPO_PUBLIC_TERRA_API_KEY!;
const TERRA_DEV_ID = process.env.EXPO_PUBLIC_TERRA_DEV_ID!;
const TERRA_BASE_URL = 'https://api.tryterra.co/v2';

export interface TerraUser {
  user_id: string;
  provider: string;
  last_webhook_update: string;
}

export interface HealthData {
  heart_rate?: number;
  steps?: number;
  calories?: number;
  distance?: number;
  sleep_hours?: number;
  active_minutes?: number;
  timestamp: string;
}

class TerraAPI {
  private headers = {
    'dev-id': TERRA_DEV_ID,
    'X-API-Key': TERRA_API_KEY,
    'Content-Type': 'application/json',
  };

  async generateAuthURL(provider: string, reference_id: string) {
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
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw error;
    }
  }

  async getUsers() {
    try {
      const response = await fetch(`${TERRA_BASE_URL}/users`, {
        headers: this.headers,
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getDailyData(user_id: string, start_date: string, end_date: string) {
    try {
      const response = await fetch(
        `${TERRA_BASE_URL}/daily/${user_id}?start_date=${start_date}&end_date=${end_date}`,
        {
          headers: this.headers,
        }
      );
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching daily data:', error);
      throw error;
    }
  }

  async getBodyData(user_id: string, start_date: string, end_date: string) {
    try {
      const response = await fetch(
        `${TERRA_BASE_URL}/body/${user_id}?start_date=${start_date}&end_date=${end_date}`,
        {
          headers: this.headers,
        }
      );
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching body data:', error);
      throw error;
    }
  }

  async getSleepData(user_id: string, start_date: string, end_date: string) {
    try {
      const response = await fetch(
        `${TERRA_BASE_URL}/sleep/${user_id}?start_date=${start_date}&end_date=${end_date}`,
        {
          headers: this.headers,
        }
      );
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      throw error;
    }
  }
}

export const terraAPI = new TerraAPI();