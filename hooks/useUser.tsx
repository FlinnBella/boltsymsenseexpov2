import { useContext } from 'react';
import { AuthContext } from '@/app/contexts/AuthContext';

export function useUser() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useUser must be used within an AuthProvider');
    }
    return context;
}