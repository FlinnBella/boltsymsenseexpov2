import { createContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const UserContext = createContext<any>(null);

export default function UserProvider({ children }: { children: React.ReactNode }) {
    const [userData, setUserData] = useState<any>(null);
    const [isFrameworkReady, setIsFrameworkReady] = useState(false);
    
    // Use the same hook as RootLayout
    useFrameworkReady();

    // First, wait for framework to be ready
    useEffect(() => {
        const checkReady = async () => {
            // Wait a tick for framework to be ready (similar to RootLayout)
            await new Promise(resolve => setTimeout(resolve, 1));
            setIsFrameworkReady(true);
        };
        checkReady();
    }, []);

    // Load user data from cache or database
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // First try to get from AsyncStorage cache
                const cachedUserData = await AsyncStorage.getItem('userData');
                if (cachedUserData) {
                    const parsedData = JSON.parse(cachedUserData);
                    console.log('Loaded user data from cache:', parsedData);
                    setUserData(parsedData);
                    return;
                }

                // If no cache, try to get from database if user is authenticated
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.log('No authenticated user found');
                    return;
                }

                console.log('Fetching user data from database for user:', user.id);
                const { data: userProfile, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (error) {
                    console.error('Error fetching user data from database:', error);
                    return;
                }

                console.log('User data fetched from database:', userProfile);
                setUserData(userProfile);
                
                // Cache the data in AsyncStorage
                await AsyncStorage.setItem('userData', JSON.stringify(userProfile));
                
            } catch (error) {
                console.error('Error in loadUserData:', error);
                // On network errors or other issues, userData stays null
            }
        };
        
        if (isFrameworkReady) {
            loadUserData();
        }
    }, [isFrameworkReady]);

    // Function to refresh user data (for use after profile updates)
    const refreshUserData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('No authenticated user found for refresh');
                return;
            }

            console.log('Refreshing user data from database');
            const { data: userProfile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (error) {
                console.error('Error refreshing user data:', error);
                return;
            }

            console.log('User data refreshed:', userProfile);
            setUserData(userProfile);
            
            // Update cache
            await AsyncStorage.setItem('userData', JSON.stringify(userProfile));
            
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

    // Function to clear user data (for logout)
    const clearUserData = async () => {
        try {
            setUserData(null);
            await AsyncStorage.removeItem('userData');
            console.log('User data cleared');
        } catch (error) {
            console.error('Error clearing user data:', error);
        }
    };

    return(
        <UserContext.Provider value={{ 
            userData, 
            setUserData, 
            refreshUserData, 
            clearUserData 
        }}>
            {children}
        </UserContext.Provider>
    );
}