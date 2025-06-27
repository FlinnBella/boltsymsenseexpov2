import { Alert, KeyboardAvoidingView, Platform, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

//TODO: useUser looks at the user's cache to login to the app. Either get rid of the login
//with a simple look at the user's cache, or use the login component. 
//Need functionality to check and then skip. 

//hooks
import { useUserProfile } from '@/stores/useUserStore';
import { useUserStore } from '@/stores/useUserStore';

export default function LoginScreen() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const userProfile = useUserProfile();
const { fetchUserProfile, setAuth } = useUserStore();

const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  setLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    //console.log(data.user);
    if (data.user != null) {
      // Update auth state
      if (data.session) {
        await AsyncStorage.setItem('authToken', data.session.access_token);
        setAuth({
          isAuthenticated: true,
          isLoading: false,
          sessionToken: data.session.access_token,
        });
      }
      
      // Check if local cache is empty and fetch user profile if needed
      if (!userProfile) {
        try {
          await fetchUserProfile();
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Continue with login even if profile fetch fails
        }
      }
        
      setLoading(false);
      router.replace('/(tabs)');
      return;
    }

    if (error) {
      console.error('Login error:', error.message);
      return;
    }
  } catch (error) {
    Alert.alert('Error', 'An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};

return (
  <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.container}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <Animated.View entering={FadeInUp.duration(800)} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your health dashboard</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail color="#6B7280" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color="#6B7280" size={20} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <EyeOff color="#6B7280" size={20} />
              ) : (
                <Eye color="#6B7280" size={20} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading ? styles.buttonDisabled : null]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  </LinearGradient>
);
}

const styles = StyleSheet.create({
container: {
  flex: 1,
},
keyboardView: {
  flex: 1,
},
content: {
  flex: 1,
  justifyContent: 'center',
  paddingHorizontal: 24,
},
header: {
  alignItems: 'center',
  marginBottom: 48,
},
title: {
  fontSize: 32,
  fontFamily: 'Poppins-Bold',
  color: 'white',
  marginBottom: 8,
},
subtitle: {
  fontSize: 16,
  fontFamily: 'Inter-Regular',
  color: 'rgba(255, 255, 255, 0.8)',
  textAlign: 'center',
},
form: {
  gap: 16,
},
inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'white',
  borderRadius: 12,
  paddingHorizontal: 16,
  height: 56,
},
inputIcon: {
  marginRight: 12,
},
input: {
  flex: 1,
  fontSize: 16,
  fontFamily: 'Inter-Regular',
  color: '#1F2937',
},
passwordInput: {
  paddingRight: 40,
},
eyeIcon: {
  position: 'absolute',
  right: 16,
},
button: {
  backgroundColor: '#F97316',
  borderRadius: 12,
  height: 56,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 8,
},
buttonDisabled: {
  opacity: 0.6,
},
buttonText: {
  fontSize: 16,
  fontFamily: 'Inter-SemiBold',
  color: 'white',
},
linkButton: {
  alignItems: 'center',
  marginTop: 16,
},
linkText: {
  fontSize: 14,
  fontFamily: 'Inter-Regular',
  color: 'rgba(255, 255, 255, 0.8)',
},
linkTextBold: {
  fontFamily: 'Inter-SemiBold',
  color: 'white',
},
});