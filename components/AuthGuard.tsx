import React, { useEffect, useState } from 'react';
import { router, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import LoadingScreen from '@/components/LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const segments = useSegments();
  
  const { 
    auth, 
    setAuth, 
    initializeUserData, 
    clearUserData 
  } = useUserStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuth({ isLoading: true });

        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setAuth({ 
            isAuthenticated: true, 
            isLoading: false,
            sessionToken: session.access_token 
          });
          await initializeUserData();
        } else {
          setAuth({ isAuthenticated: false, isLoading: false });
          clearUserData();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuth({ isAuthenticated: false, isLoading: false });
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await AsyncStorage.setItem('authToken', session?.access_token || '');
          setAuth({ 
            isAuthenticated: true, 
            isLoading: false,
            sessionToken: session?.access_token || ''
          });
          await initializeUserData();
        } else if (event === 'SIGNED_OUT') {
          await AsyncStorage.removeItem('authToken');
          clearUserData();
          setAuth({ isAuthenticated: false, isLoading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!auth.isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (auth.isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [auth.isAuthenticated, segments, isInitialized]);

  if (!isInitialized || auth.isLoading) {
    return <LoadingScreen visible={true} />;
  }

  return <>{children}</>;
}
