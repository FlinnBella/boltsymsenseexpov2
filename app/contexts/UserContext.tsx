import { createContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";


export const UserContext = createContext<any>(null);

export default function UserProvider({ children }: { children: React.ReactNode }) {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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
    // need to verify user us actually authenticated beforehand 
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.log('No authenticated user found');
                    return;
                }
                console.log(user)
                const { data: userProfile, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                console.log(userProfile)
                console.log('User found!');
                
                if (error) {
                    console.error('Error fetching user data:', error);
                    return;
                }

                //console.log('User ID:', user.id);
                //console.log('User Profile:', userProfile);
                
                setUserData(userProfile);
            } catch (error) {
                console.error('Error in fetchUser:', error);
            } finally {
                setLoading(false);
            }
        };
        
        if (isFrameworkReady) {
            fetchUser();
        }
    }, [isFrameworkReady]);

    return(
        <UserContext.Provider value={{ userData, setUserData }}>
            {children}
        </UserContext.Provider>
    );
}

