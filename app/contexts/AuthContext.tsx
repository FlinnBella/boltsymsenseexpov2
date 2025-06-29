import { createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

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
  async function signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      if (data?.idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: data?.idToken,
        });
        if (error) {
          console.error('Error signing in with Google:', error.message);
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
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'facebook',
          token: data.accessToken,
        });
        if (error) {
          console.error('Error signing in with Facebook:', error.message);
        }
      }
    } catch (error) {
      console.error('Facebook Sign-In error:', error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
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

""