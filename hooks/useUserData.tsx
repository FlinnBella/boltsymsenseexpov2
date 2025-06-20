import { useContext } from "react";
import { UserContext } from "@/app/contexts/UserContext";

export function useUserData() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUserData must be used within an UserProvider');
    }
    return context;
}