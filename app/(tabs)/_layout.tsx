import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { MessageCircle, Home, User, CircleAlert as AlertCircle, Pill, TrendingUp, Apple, Heart } from 'lucide-react-native';
import { useThemeColors } from '@/stores/useThemeStore';

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: true,
          headerStyle: {
            borderBottomWidth: 0,
            height: 100,
            elevation: 0,
            shadowOpacity: 0,
            backgroundColor: colors.surface,
          },
          headerTransparent: false,
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: 'Poppins-Bold',
            fontSize: 18,
            color: colors.text,
            textAlign: 'center',
            alignSelf: 'center',
            flex: 1,
            position: 'absolute',
            left: 0,
            right: 0,
          },
          drawerStyle: {
            backgroundColor: colors.surface,
          },
          drawerContentStyle: {
            backgroundColor: colors.surface,
          },
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.textSecondary,
          drawerActiveBackgroundColor: colors.primary + '20',
          drawerInactiveBackgroundColor: 'transparent',
          drawerLabelStyle: {
            fontFamily: 'Inter-Medium',
            fontSize: 16,
            color: colors.text,
          },
        }}
      >
        <Drawer.Screen 
          name="index" 
          options={{ 
            title: 'SymSense Chat',
            drawerIcon: ({ color }) => <MessageCircle color={color} size={24} />
          }} 
        />
        <Drawer.Screen 
          name="stats" 
          options={{ 
            title: 'Health Statistics',
            drawerIcon: ({ color }) => <TrendingUp color={color} size={24} />
          }} 
        />
        <Drawer.Screen 
          name="profile" 
          options={{ 
            title: 'Profile',
            drawerIcon: ({ color }) => <User color={color} size={24} />
          }} 
        />
        <Drawer.Screen 
          name="symptomtracker" 
          options={{ 
            title: 'Log Symptoms',
            drawerIcon: ({ color }) => <AlertCircle color={color} size={24} />
          }} 
        />
        <Drawer.Screen 
          name="add-medication" 
          options={{ 
            title: 'Add Medication',
            drawerIcon: ({ color }) => <Pill color={color} size={24} />
          }} 
        />
        <Drawer.Screen 
          name="food-logging" 
          options={{ 
            title: 'Food Log',
            drawerIcon: ({ color }) => <Apple color={color} size={24} />
          }} 
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
