import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { MedicationLog, SymptomLog, FoodLog } from '@/lib/api/healthTracking';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

// Types for the user store
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  profile_image_url?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  autoimmune_diseases?: string[];
  provider?: string;
  provider_id?: string;
  email_verified?: boolean;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HealthData {
  steps: number;
  heartRate: number;
  calories: number;
  sleep: number;
  activeMinutes: number;
  distance: number;
  lastUpdated?: string;
  HealthGoals: {
    entries: string;
    steps: number;
    calories: number;
    activeMinutes: number;
  }
}

export interface HealthGoals {
  steps: number;
  calories: number;
  activeMinutes: number;
  sleepHours: number;
}

export interface UserPreferences {
  wearableConnected: boolean;
  wearablePromptDismissed: boolean;
  notifications: {
    achievements: boolean;
    healthAlerts: boolean;
    medications: boolean;
    appointments: boolean;
  };
  dashboard_layout?: any;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionToken?: string;
}

// Enhanced FoodLog interface with calories
export interface EnhancedFoodLog extends FoodLog {
  calories?: number;
  portion_size?: string;
}

interface UserStore {
  // Auth state
  auth: AuthState;
  
  // User data
  userProfile: UserProfile | null;
  healthData: HealthData;
  preferences: UserPreferences;
  
  // Health tracking data
  medications: MedicationLog[];
  symptoms: SymptomLog[];
  foodLogs: EnhancedFoodLog[];
  
  // Loading states
  isLoadingProfile: boolean;
  isLoadingHealthData: boolean;
  isLoadingPreferences: boolean;
  isLoadingMedications: boolean;
  isLoadingSymptoms: boolean;
  isLoadingFoodLogs: boolean;
  
  // Actions
  setAuth: (auth: Partial<AuthState>) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setHealthData: (data: Partial<HealthData>) => void;
  updateHealthData: (data: Partial<HealthData>) => Promise<void>;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  
  // Authentication actions
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signInWithFacebook: () => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ data: any; error: any }>;
  sendVerificationEmail: (email: string, firstName: string) => Promise<void>;
  
  // Data fetching actions
  fetchUserProfile: () => Promise<void>;
  fetchHealthData: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  fetchMedications: () => Promise<void>;
  fetchSymptoms: () => Promise<void>;
  fetchFoodLogs: () => Promise<void>;
  initializeUserData: () => Promise<void>;
  
  // Utility actions
  clearUserData: () => void;
  reset: () => void;
}

// Default values
const defaultHealthData: HealthData = {
  steps: 0,
  heartRate: 0,
  calories: 0,
  sleep: 0,
  activeMinutes: 0,
  distance: 0,
  HealthGoals: {
    entries: 'none',
    steps: 10000,
    calories: 2000,
    activeMinutes: 60,
  },
};

const defaultPreferences: UserPreferences = {
  notifications: {
    achievements: true,
    healthAlerts: true,
    medications: true,
    appointments: true,
  },
  wearableConnected: false,
  wearablePromptDismissed: false,
};

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  sessionToken: undefined,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      auth: defaultAuthState,
      userProfile: null,
      healthData: defaultHealthData,
      preferences: defaultPreferences,
      
      // Health tracking data
      medications: [],
      symptoms: [],
      foodLogs: [],
      
      // Loading states
      isLoadingProfile: false,
      isLoadingHealthData: false,
      isLoadingPreferences: false,
      isLoadingMedications: false,
      isLoadingSymptoms: false,
      isLoadingFoodLogs: false,

      // Auth actions
      setAuth: (auth) => set((state) => ({ 
        auth: { ...state.auth, ...auth } 
      })),

      // User profile actions
      setUserProfile: (profile) => set({ userProfile: profile }),

      updateUserProfile: async (updates) => {
        const { userProfile } = get();
        if (!userProfile) {
          throw new Error('No user profile available');
        }

        set({ isLoadingProfile: true });
        try {
          const { error } = await supabase
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userProfile.id);

          if (error) throw error;

          // Update local state immediately
          set((state) => ({
            userProfile: state.userProfile ? { 
              ...state.userProfile, 
              ...updates,
              updated_at: new Date().toISOString()
            } : null,
          }));
        } catch (error) {
          console.error('Error updating user profile:', error);
          throw error;
        } finally {
          set({ isLoadingProfile: false });
        }
      },

      // Health data actions
      setHealthData: (data) => set((state) => ({ 
        healthData: { ...state.healthData, ...data, lastUpdated: new Date().toISOString() }
      })),

      updateHealthData: async (data) => {
        const { userProfile } = get();
        if (!userProfile) {
          throw new Error('No user profile available');
        }

        set({ isLoadingHealthData: true });
        try {
          // Map frontend field names to database field names
          const dbData = {
            user_id: userProfile.id,
            steps: data.steps,
            heart_rate: data.heartRate,
            calories: data.calories,
            sleep: data.sleep,
            active_minutes: data.activeMinutes,
            distance: data.distance,
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('health_data_cache')
            .upsert(dbData);

          if (error) throw error;

          // Update local state immediately
          set((state) => ({
            healthData: { 
              ...state.healthData, 
              ...data, 
              lastUpdated: new Date().toISOString() 
            },
          }));
        } catch (error) {
          console.error('Error updating health data:', error);
          throw error;
        } finally {
          set({ isLoadingHealthData: false });
        }
      },

      // Preferences actions
      setPreferences: (preferences) => set((state) => ({ 
        preferences: { ...state.preferences, ...preferences }
      })),

      updatePreferences: async (updates) => {
        const { userProfile, preferences } = get();
        if (!userProfile) {
          throw new Error('No user profile available');
        }

        set({ isLoadingPreferences: true });
        try {
          // Map frontend preference keys to database column names
          const dbUpdates: any = {
            user_id: userProfile.id,
          };

          // Map specific preference updates to database columns
          if (updates.wearableConnected !== undefined) {
            dbUpdates.wearable_connected = updates.wearableConnected;
          }
          if (updates.wearablePromptDismissed !== undefined) {
            dbUpdates.wearable_prompt_dismissed = updates.wearablePromptDismissed;
          }
          if (updates.notifications !== undefined) {
            dbUpdates.notification_preferences = updates.notifications;
          }

          const { error } = await supabase
            .from('user_preferences')
            .upsert(dbUpdates, { onConflict: 'user_id' });

          if (error) throw error;

          // Update local state immediately
          set((state) => ({
            preferences: { ...state.preferences, ...updates },
          }));
        } catch (error) {
          console.error('Error updating preferences:', error);
          throw error;
        } finally {
          set({ isLoadingPreferences: false });
        }
      },

      // Authentication actions
      signIn: async (email, password) => {
        set((state) => ({ auth: { ...state.auth, isLoading: true } }));
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set((state) => ({ auth: { ...state.auth, isLoading: false } }));
            return { data: null, error };
          }

          if (data.user && data.session) {
            await AsyncStorage.setItem('authToken', data.session.access_token);
            
            set((state) => ({
              auth: {
                ...state.auth,
                isAuthenticated: true,
                isLoading: false,
                sessionToken: data.session.access_token,
              },
            }));

            // Initialize user data after successful sign in
            await get().initializeUserData();
          }

          return { data, error: null };
        } catch (error) {
          console.error('Error signing in:', error);
          set((state) => ({ auth: { ...state.auth, isLoading: false } }));
          return { data: null, error };
        }
      },

      signInWithGoogle: async () => {
        set((state) => ({ auth: { ...state.auth, isLoading: true } }));
        
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          
          if (userInfo.data?.idToken) {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: userInfo.data.idToken,
            });

            if (error) {
              set((state) => ({ auth: { ...state.auth, isLoading: false } }));
              return { data: null, error };
            }

            if (data.user && data.session) {
              await AsyncStorage.setItem('authToken', data.session.access_token);
              
              set((state) => ({
                auth: {
                  ...state.auth,
                  isAuthenticated: true,
                  isLoading: false,
                  sessionToken: data.session.access_token,
                },
              }));

              // Initialize user data after successful sign in
              await get().initializeUserData();
            }

            return { data, error: null };
          }

          throw new Error('No ID token received from Google');
        } catch (error) {
          console.error('Error signing in with Google:', error);
          set((state) => ({ auth: { ...state.auth, isLoading: false } }));
          return { data: null, error: { message: error.message } };
        }
      },

      signInWithFacebook: async () => {
        set((state) => ({ auth: { ...state.auth, isLoading: true } }));
        
        try {
          const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
          
          if (result.isCancelled) {
            set((state) => ({ auth: { ...state.auth, isLoading: false } }));
            return { data: null, error: { message: 'User cancelled login' } };
          }

          const data = await AccessToken.getCurrentAccessToken();
          
          if (data?.accessToken) {
            const { data: authData, error } = await supabase.auth.signInWithIdToken({
              provider: 'facebook',
              token: data.accessToken,
            });

            if (error) {
              set((state) => ({ auth: { ...state.auth, isLoading: false } }));
              return { data: null, error };
            }

            if (authData.user && authData.session) {
              await AsyncStorage.setItem('authToken', authData.session.access_token);
              
              set((state) => ({
                auth: {
                  ...state.auth,
                  isAuthenticated: true,
                  isLoading: false,
                  sessionToken: authData.session.access_token,
                },
              }));

              // Initialize user data after successful sign in
              await get().initializeUserData();
            }

            return { data: authData, error: null };
          }

          throw new Error('No access token received from Facebook');
        } catch (error) {
          console.error('Error signing in with Facebook:', error);
          set((state) => ({ auth: { ...state.auth, isLoading: false } }));
          return { data: null, error: { message: error.message } };
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          await GoogleSignin.signOut();
          await LoginManager.logOut();
        } catch (error) {
          console.error('Error signing out from providers:', error);
        } finally {
          try {
            await AsyncStorage.removeItem('authToken');
            get().clearUserData();
          } catch (error) {
            console.error('Error clearing local data:', error);
          }
        }
      },

      signUp: async (email, password, userData = {}) => {
        set((state) => ({ auth: { ...state.auth, isLoading: true } }));
        
        try {
          // First, check if email already exists in the users table
          const { data: existingUsers, error: lookupError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .limit(1);

          if (lookupError) {
            console.error('Error checking for existing user:', lookupError);
            set((state) => ({ auth: { ...state.auth, isLoading: false } }));
            return { 
              data: null, 
              error: { message: 'Failed to verify email availability' }
            };
          }

          if (existingUsers && existingUsers.length > 0) {
            set((state) => ({ auth: { ...state.auth, isLoading: false } }));
            return { 
              data: null, 
              error: { message: 'Email already registered' }
            };
          }

          // If email doesn't exist, proceed with signup
          const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password,
            options: {
              data: {
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                ...userData
              }
            }
          });

          if (error) {
            set((state) => ({ auth: { ...state.auth, isLoading: false } }));
            return { data: null, error };
          }

          // Send verification email
          if (data.user && userData.first_name) {
            try {
              await get().sendVerificationEmail(email, userData.first_name);
            } catch (emailError) {
              console.error('Error sending verification email:', emailError);
              // Don't fail signup if email sending fails
            }
          }

          set((state) => ({ auth: { ...state.auth, isLoading: false } }));
          return { data, error: null };
        } catch (error) {
          console.error('Error signing up:', error);
          set((state) => ({ auth: { ...state.auth, isLoading: false } }));
          return { data: null, error };
        }
      },

      sendVerificationEmail: async (email: string, firstName: string) => {
        try {
          const verificationUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=example&type=signup&redirect_to=${encodeURIComponent('symsense://verify-email')}`;
          
          const { error } = await supabase.functions.invoke('send-verification-email', {
            body: {
              email,
              firstName,
              verificationUrl,
            },
          });

          if (error) throw error;
        } catch (error) {
          console.error('Error sending verification email:', error);
          throw error;
        }
      },

      // Data fetching actions
      fetchUserProfile: async () => {
        const { auth } = get();
        if (!auth.isAuthenticated) return;

        set({ isLoadingProfile: true });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No authenticated user');

          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          set({ userProfile, isLoadingProfile: false });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          set({ isLoadingProfile: false });
        }
      },

      fetchHealthData: async () => {
        const { userProfile } = get();
        if (!userProfile) return;

        set({ isLoadingHealthData: true });
        try {
          const { data, error } = await supabase
            .from('health_data_cache')
            .select('*')
            .eq('user_id', userProfile.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            throw error;
          }

          if (data) {
            set((state) => ({
              healthData: {
                steps: data.steps || 0,
                heartRate: data.heart_rate || 0,
                calories: data.calories || 0,
                sleep: data.sleep || 0,
                activeMinutes: data.active_minutes || 0,
                distance: data.distance || 0,
                lastUpdated: data.updated_at,
                HealthGoals: {
                  entries: data.health_goals_entries || 'none',
                  steps: data.health_goals_steps || 10000,
                  calories: data.health_goals_calories || 2000,
                  activeMinutes: data.health_goals_active_minutes || 60,
                },
              },
              isLoadingHealthData: false,
            }));
          } else {
            set({ isLoadingHealthData: false });
          }
        } catch (error) {
          console.error('Error fetching health data:', error);
          set({ isLoadingHealthData: false });
        }
      },

      fetchPreferences: async () => {
        const { userProfile } = get();
        if (!userProfile) return;

        set({ isLoadingPreferences: true });
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userProfile.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            throw error;
          }

          if (data) {
            // Map database columns to frontend preference structure
            const preferences = {
              ...defaultPreferences,
              wearableConnected: data.wearable_connected || false,
              wearablePromptDismissed: data.wearable_prompt_dismissed || false,
              notifications: data.notification_preferences || defaultPreferences.notifications,
            };
            
            set({
              preferences,
              isLoadingPreferences: false,
            });
          } else {
            set({ isLoadingPreferences: false });
          }
        } catch (error) {
          console.error('Error fetching preferences:', error);
          set({ isLoadingPreferences: false });
        }
      },

      fetchMedications: async () => {
        const { userProfile } = get();
        if (!userProfile) return;

        set({ isLoadingMedications: true });
        try {
          const { data, error } = await supabase
            .from('medication_logs')
            .select('*')
            .eq('user_id', userProfile.id)
            .order('taken_at', { ascending: false })
            .limit(30); // Get last 30 entries for context

          if (error) throw error;

          set({ 
            medications: data || [],
            isLoadingMedications: false 
          });
        } catch (error) {
          console.error('Error fetching medications:', error);
          set({ isLoadingMedications: false });
        }
      },

      fetchSymptoms: async () => {
        const { userProfile } = get();
        if (!userProfile) return;

        set({ isLoadingSymptoms: true });
        try {
          const { data, error } = await supabase
            .from('symptom_logs')
            .select('*')
            .eq('user_id', userProfile.id)
            .order('logged_at', { ascending: false })
            .limit(30); // Get last 30 entries for context

          if (error) throw error;

          set({ 
            symptoms: data || [],
            isLoadingSymptoms: false 
          });
        } catch (error) {
          console.error('Error fetching symptoms:', error);
          set({ isLoadingSymptoms: false });
        }
      },

      fetchFoodLogs: async () => {
        const { userProfile } = get();
        if (!userProfile) return;

        set({ isLoadingFoodLogs: true });
        try {
          const { data, error } = await supabase
            .from('food_logs_cache')
            .select('*')
            .eq('user_id', userProfile.id)
            .order('consumed_at', { ascending: false })
            .limit(30); // Get last 30 entries for context

          if (error) throw error;

          set({ 
            foodLogs: data || [],
            isLoadingFoodLogs: false 
          });
        } catch (error) {
          console.error('Error fetching food logs:', error);
          set({ isLoadingFoodLogs: false });
        }
      },

      initializeUserData: async () => {
        const store = get();
        try {
          // First fetch profile and preferences
          await Promise.all([
            store.fetchUserProfile(),
            store.fetchPreferences(),
          ]);
          
          // Then fetch health data and tracking data after profile is loaded
          await Promise.all([
            store.fetchHealthData(),
            store.fetchMedications(),
            store.fetchSymptoms(),
            store.fetchFoodLogs(),
          ]);
        } catch (error) {
          console.error('Error initializing user data:', error);
          throw error;
        }
      },

      // Utility actions
      clearUserData: () => set({
        auth: { ...defaultAuthState, isLoading: false },
        userProfile: null,
        healthData: defaultHealthData,
        preferences: defaultPreferences,
        medications: [],
        symptoms: [],
        foodLogs: [],
        isLoadingProfile: false,
        isLoadingHealthData: false,
        isLoadingPreferences: false,
        isLoadingMedications: false,
        isLoadingSymptoms: false,
        isLoadingFoodLogs: false,
      }),

      reset: () => set({
        auth: defaultAuthState,
        userProfile: null,
        healthData: defaultHealthData,
        preferences: defaultPreferences,
        medications: [],
        symptoms: [],
        foodLogs: [],
        isLoadingProfile: false,
        isLoadingHealthData: false,
        isLoadingPreferences: false,
        isLoadingMedications: false,
        isLoadingSymptoms: false,
        isLoadingFoodLogs: false,
      }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain parts of the state
      partialize: (state) => ({
        auth: {
          isAuthenticated: state.auth.isAuthenticated,
          sessionToken: state.auth.sessionToken,
        },
        userProfile: state.userProfile,
        preferences: state.preferences,
        // Don't persist health data as it should be fresh from API
      }),
    }
  )
);

// Selectors for easy access to specific parts of the store
export const useAuth = () => useUserStore((state) => state.auth);
export const useUserProfile = () => useUserStore((state) => state.userProfile);
export const useHealthData = () => useUserStore((state) => state.healthData);
export const useUserPreferences = () => useUserStore((state) => state.preferences);

// Health tracking data selectors
export const useMedications = () => useUserStore((state) => state.medications);
export const useSymptoms = () => useUserStore((state) => state.symptoms);
export const useFoodLogs = () => useUserStore((state) => state.foodLogs);

// Individual loading state selectors to avoid creating new objects
export const useIsLoadingProfile = () => useUserStore((state) => state.isLoadingProfile);
export const useIsLoadingHealthData = () => useUserStore((state) => state.isLoadingHealthData);
export const useIsLoadingPreferences = () => useUserStore((state) => state.isLoadingPreferences);
export const useIsLoadingMedications = () => useUserStore((state) => state.isLoadingMedications);
export const useIsLoadingSymptoms = () => useUserStore((state) => state.isLoadingSymptoms);
export const useIsLoadingFoodLogs = () => useUserStore((state) => state.isLoadingFoodLogs);