import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { MessageCircle, Chrome as Home, User, CircleAlert as AlertCircle, Pill, TrendingUp, Apple, Heart } from 'lucide-react-native';

export default function TabLayout() {
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
          },
          headerTransparent: true,
          headerBackground: () => <View style={styles.header} />,
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontFamily: 'Poppins-Bold',
            fontSize: 18,
            color: '#000000',
            textAlign: 'center',
            alignSelf: 'center',
            flex: 1,
            position: 'absolute',
            left: 0,
            right: 0,
          },
          drawerStyle: {
            backgroundColor: 'white',
          },
        }}
      >
        <Drawer.Screen 
          name="index" 
          options={{ 
            title: 'SymSense Chat',
            drawerIcon: () => <MessageCircle color="black" size={24} />
          }} 
        />
        <Drawer.Screen 
          name="stats" 
          options={{ 
            title: 'Statistics',
            drawerIcon: () => <TrendingUp color="black" size={24} />
          }} 
        />
        <Drawer.Screen 
          name="profile" 
          options={{ 
            title: 'Profile',
            drawerIcon: () => <User color="black" size={24} />
          }} 
        />
        <Drawer.Screen 
          name="symptomtracker" 
          options={{ 
            title: 'Log Symptoms',
            drawerIcon: () => <AlertCircle color="black" size={24} />
          }} 
        />
        <Drawer.Screen 
          name="add-medication" 
          options={{ 
            title: 'Add Medication',
            drawerIcon: () => <Pill color="black" size={24} />
          }} 
        />
        <Drawer.Screen 
          name="health-metrics" 
          options={{ 
            title: 'Health Metrics',
            drawerIcon: () => <Heart color="black" size={24} />
          }} 
        />
        <Drawer.Screen 
          name="food-logging" 
          options={{ 
            title: 'Food Log',
            drawerIcon: () => <Apple color="black" size={24} />
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