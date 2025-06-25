import { useEffect, useState } from 'react';
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
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    console.log('Auth Status:', auth.isAuthenticated);
    console.log('Current Route Group:', segments[0]);
    console.log('In Auth Group:', inAuthGroup);

    // Redirect logic
    if (!auth.isAuthenticated && !inAuthGroup) {
      console.log('Redirecting to login - user not authenticated');
      router.replace('/(auth)/login');
    } else if (auth.isAuthenticated && inAuthGroup) {
      console.log('Redirecting to tabs - user authenticated');
      router.replace('/(tabs)');
    }
  }, [auth.isAuthenticated, segments, isInitialized]);

  const initializeAuth = async () => {
    try {
      setAuth({ isLoading: true });

      // Check for stored auth token
      const token = await AsyncStorage.getItem('authToken');
      
      // Check current Supabase session
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log('Stored token exists:', !!token);
      console.log('Supabase user exists:', !!user);
      
      if (token && user) {
        // User is authenticated
        setAuth({ 
          isAuthenticated: true, 
          isLoading: false,
          sessionToken: token 
        });
        
        // Initialize user data
        await initializeUserData();
      } else {
        // User is not authenticated
        setAuth({ 
          isAuthenticated: false, 
          isLoading: false,
          sessionToken: undefined 
        });
        
        // Clear any persisted user data
        clearUserData();
        
        // Clean up AsyncStorage if needed
        if (!user && token) {
          await AsyncStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setAuth({ 
        isAuthenticated: false, 
        isLoading: false,
        sessionToken: undefined 
      });
    } finally {
      setIsInitialized(true);
    }
  };

  // Listen to auth changes from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (!session) {
            await AsyncStorage.removeItem('authToken');
            clearUserData();
            setAuth({ 
              isAuthenticated: false, 
              isLoading: false,
              sessionToken: undefined 
            });
          }
        }
        
        if (event === 'SIGNED_IN' && session) {
          await AsyncStorage.setItem('authToken', session.access_token);
          setAuth({ 
            isAuthenticated: true, 
            isLoading: false,
            sessionToken: session.access_token 
          });
          await initializeUserData();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Show loading screen while initializing
  if (!isInitialized || auth.isLoading) {
    return <LoadingScreen visible={true} />;
  }

  return <>{children}</>;
}
