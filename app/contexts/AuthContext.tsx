import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSegments } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

// Define the AuthContext type
interface AuthContextType {
    user: any;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ data: any, error: any }>;
    signOut: () => Promise<void>;
    signUp: (email: string, password: string) => Promise<{ data: any, error: any }>;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    isAuthenticated: boolean;
}

// Update the context to use the type
export const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const segments = useSegments();
    // Add this to track framework ready state
    const [isFrameworkReady, setIsFrameworkReady] = useState(false);
    
    // Use the same hook as RootLayout
    useFrameworkReady();

    // First, wait for framework to be ready
    useEffect(() => {
        const checkReady = async () => {
            // Wait a tick for framework to be ready (similar to RootLayout)
            await new Promise(resolve => setTimeout(resolve, 1));
            setIsFrameworkReady(true);
            checkAuthStatus();
        };
        checkReady();
    }, []);

    // Then handle navigation only after framework is ready
    useEffect(() => {
        if (!isFrameworkReady) return; // Don't navigate if framework isn't ready
        
        const inAuthGroup = segments[0] === '(auth)';
        console.log('Framework Ready:', isFrameworkReady);
        console.log('isAuthenticated:', isAuthenticated);
        console.log('inAuthGroup:', inAuthGroup);

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, segments, isFrameworkReady]);

    // Show children only when framework is ready
    if (!isFrameworkReady) {
        return null;
    }

    const checkAuthStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const { data: { user } } = await supabase.auth.getUser();
            // && !!token eventually  
            //console.log('userFromCheckAuthStatus:', user);
            console.log('token:', !!token);
            if (!!token && user) { 
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            //setIsAuthenticated(false);
        }
    };

    async function signIn(email: string, password: string) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (data.user) {
                setIsAuthenticated(true);
            }
            return { data, error };
        } catch (error) {
            console.error('Error signing in:', error);
            return { data: null, error };
        }
    }

    async function signOut() {
        try {
            const { error } = await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    async function signUp(email: string, password: string) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            return { data, error };
        } catch (error) {
            console.error('Error signing up:', error);
            return { data: null, error };
        }
    }

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            signIn, 
            signOut, 
            signUp, 
            setIsAuthenticated, 
            isAuthenticated 
        }}>
            {children}
        </AuthContext.Provider>
    );
}