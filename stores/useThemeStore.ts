import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FAFAFA', // Salt white
  primary: '#064E3B', // Current jade green
  secondary: '#10B981',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export const darkTheme: ThemeColors = {
  background: '#1A1A1A', // Dark gray instead of pure black
  surface: '#2D2D2D', // Slightly lighter dark gray
  primary: '#064E3B', // Same jade green
  secondary: '#10B981',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

interface ThemeStore {
  isDarkMode: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      colors: lightTheme,
      
      toggleTheme: () => {
        const { isDarkMode } = get();
        const newIsDarkMode = !isDarkMode;
        set({
          isDarkMode: newIsDarkMode,
          colors: newIsDarkMode ? darkTheme : lightTheme,
        });
      },
      
      setTheme: (isDark: boolean) => {
        set({
          isDarkMode: isDark,
          colors: isDark ? darkTheme : lightTheme,
        });
      },
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const useIsDarkMode = () => useThemeStore((state) => state.isDarkMode);
export const useThemeColors = () => useThemeStore((state) => state.colors);