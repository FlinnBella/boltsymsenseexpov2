import { createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/stores/useUserStore';

interface AuthContextType {
  signIn: (email: string, password: string) => Promise<{ data: any, error: any }>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ data: any, error: any }>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setUserProfile, initializeUserData } = useUserStore();

  async function signIn(email: string, password: string) {
    const result = await supabase.auth.signInWithPassword({ email, password });
    
    if (result.data.session) {
      // Store session data in AsyncStorage
      await AsyncStorage.setItem('authToken', result.data.session.access_token);
      await AsyncStorage.setItem('userSession', JSON.stringify({
        userId: result.data.user?.id,
        email: result.data.user?.email,
        accessToken: result.data.session.access_token,
        refreshToken: result.data.session.refresh_token,
      }));
    }
    
    return result;
  }

  async function signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      
      if (data?.idToken) {
        const { data: authData, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: data.idToken,
        });

        if (error) {
          console.error('Error signing in with Google:', error.message);
          return;
        }

        if (authData.user && authData.session) {
          // Store auth token in AsyncStorage
          await AsyncStorage.setItem('authToken', authData.session.access_token);
          await AsyncStorage.setItem('userSession', JSON.stringify({
            userId: authData.user.id,
            email: authData.user.email,
            accessToken: authData.session.access_token,
            refreshToken: authData.session.refresh_token,
            provider: 'google',
          }));
          
          // Check if user exists in our users table
          const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (userError && userError.code === 'PGRST116') {
            // User doesn't exist in users table, create them
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email: authData.user.email,
                first_name: authData.user.user_metadata?.given_name || authData.user.user_metadata?.name?.split(' ')[0] || '',
                last_name: authData.user.user_metadata?.family_name || authData.user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
                profile_image_url: authData.user.user_metadata?.avatar_url || authData.user.user_metadata?.picture,
              });

            if (insertError) {
              console.error('Error creating user record:', insertError);
            }
          }

          // Update Zustand store
          setAuth({
            isAuthenticated: true,
            isLoading: false,
            sessionToken: authData.session.access_token,
          });

          // Initialize user data
          await initializeUserData();
        }
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
    }
  }

  async function signInWithFacebook() {
    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      if (result.isCancelled) {
        return;
      }

      const data = await AccessToken.getCurrentAccessToken();
      
      if (data?.accessToken) {
        const { data: authData, error } = await supabase.auth.signInWithIdToken({
          provider: 'facebook',
          token: data.accessToken,
        });

        if (error) {
          console.error('Error signing in with Facebook:', error.message);
          return;
        }

        if (authData.user && authData.session) {
          // Store auth token in AsyncStorage
          await AsyncStorage.setItem('authToken', authData.session.access_token);
          await AsyncStorage.setItem('userSession', JSON.stringify({
            userId: authData.user.id,
            email: authData.user.email,
            accessToken: authData.session.access_token,
            refreshToken: authData.session.refresh_token,
            provider: 'facebook',
          }));
          
          // Check if user exists in our users table
          const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (userError && userError.code === 'PGRST116') {
            // User doesn't exist in users table, create them
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email: authData.user.email,
                first_name: authData.user.user_metadata?.first_name || authData.user.user_metadata?.name?.split(' ')[0] || '',
                last_name: authData.user.user_metadata?.last_name || authData.user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
                profile_image_url: authData.user.user_metadata?.picture,
              });

            if (insertError) {
              console.error('Error creating user record:', insertError);
            }
          }

          // Update Zustand store
          setAuth({
            isAuthenticated: true,
            isLoading: false,
            sessionToken: authData.session.access_token,
          });

          // Initialize user data
          await initializeUserData();
        }
      }
    } catch (error) {
      console.error('Facebook Sign-In error:', error);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['authToken', 'userSession']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  }

  return (
    <AuthContext.Provider value={{ 
      signIn,
      signInWithGoogle,
      signInWithFacebook, 
      signOut, 
      signUp, 
    }}>
      {children}
    </AuthContext.Provider>
  );
}