import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import VerifiedModal from '@/components/Modal/VerifiedModal';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const AUTOIMMUNE_DISEASES = [
  { name: 'Rheumatoid Arthritis', emoji: '🦴' },
  { name: 'Type 1 Diabetes', emoji: '🩸' },
  { name: 'Multiple Sclerosis', emoji: '🧠' },
  { name: 'Systemic Lupus', emoji: '🦋' },
  { name: "Crohn's Disease", emoji: '🫁' },
  { name: 'None of the above', emoji: '❌' },
];

interface FormData {
  firstName: string;
  lastName: string;
  autoimmuneDiseases: string[];
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressAutocompleted, setAddressAutocompleted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    autoimmuneDiseases: [],
    address: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [activeStep, setActiveStep] = useState(1);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [previousStep, setPreviousStep] = useState(1);
  // Effect to handle address reset when navigating to previous steps
  useEffect(() => {
    // If user is navigating to a step before step 3 (i.e., step 1 or 2)
    // and they were previously on step 3 or later, reset address fields
    if (activeStep < 3 && previousStep >= 3) {
      resetAddressFields();
    }
    
    // Update previous step for next navigation
    setPreviousStep(activeStep);
  }, [activeStep]);

  const resetAddressFields = () => {
    console.log('Resetting address fields');
    setFormData(prev => ({
      ...prev,
      address: '',
      city: '',
      state: '',
      zipCode: '',
    }));
    setAddressAutocompleted(false);
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Error', message);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          showToast('Please enter both first and last name');
          return false;
        }
        const nameRegex = /^[a-zA-Z\s'-]+$/;
        if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
          showToast('Names can only contain letters, spaces, hyphens, and apostrophes');
          return false;
        }
        return true;
      
      case 2:
        if (formData.autoimmuneDiseases.length === 0) {
          showToast('Please select at least one option');
          return false;
        }
        return true;
      
      case 3:
        const addressRegex = /^[a-zA-Z0-9\s,.#-]+$/;
        
        if (!formData.address.trim()) {
          showToast('Please enter your address');
          return false;
        }
        if (!addressRegex.test(formData.address)) {
          showToast('Please enter a valid address (letters, numbers, spaces, and common punctuation only)');
          return false;
        }
        if (!formData.zipCode.trim()) {
          showToast('Please enter your ZIP code');
          return false;
        }
        if (!formData.city || !formData.state) {
          showToast('Please select an address from the suggestions or enter complete address information');
          return false;
        }
        return true;
      
      case 4:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!formData.email.trim()) {
          showToast('Please enter your email');
          return false;
        }
        if (!emailRegex.test(formData.email)) {
          showToast('Please enter a valid email address');
          return false;
        }
        if (!formData.password) {
          showToast('Please enter a password');
          return false;
        }
        if (formData.password.length < 8) {
          showToast('Password must be at least 8 characters');
          return false;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          showToast('Password must contain at least one uppercase letter, one lowercase letter, and one number');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          showToast('Passwords do not match');
          return false;
        }
        return true;
      
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === 4) {
        handleSignup();
      } else {
        setActiveStep(activeStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDiseaseToggle = (disease: string) => {
    const currentDiseases = [...formData.autoimmuneDiseases];
    const index = currentDiseases.indexOf(disease);
    
    if (index > -1) {
      currentDiseases.splice(index, 1);
    } else {
      // Handle mutual exclusivity with "None of the above"
      if (disease === 'None of the above') {
        updateFormData('autoimmuneDiseases', ['None of the above']);
        return;
      } else if (currentDiseases.includes('None of the above')) {
        const noneIndex = currentDiseases.indexOf('None of the above');
        currentDiseases.splice(noneIndex, 1);
      }
      currentDiseases.push(disease);
    }
    
    updateFormData('autoimmuneDiseases', currentDiseases);
  };

  const handleAddressSelect = (addressData: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  }) => {
    console.log('Address selected in signup component:', addressData);
    
    // Update all address fields at once
    setFormData(prev => ({
      ...prev,
      address: addressData.streetAddress,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
    }));
    
    setAddressAutocompleted(true);
    console.log('Form data after address selection:', {
      address: addressData.streetAddress,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
    });
  };

  const handleAddressChange = (text: string) => {
    updateFormData('address', text);
    // If user manually edits after autocomplete, reset the autocomplete state
    if (addressAutocompleted) {
      setAddressAutocompleted(false);
      updateFormData('city', '');
      updateFormData('state', '');
      updateFormData('zipCode', '');
    }
  };

  const { signUp } = useUserStore();

  const handleSignup = async () => {
    setLoading(true);
    try {
      console.log('Signing up with email:', formData.email);
      
      // Use Zustand store signup function (includes email validation)
      const { data, error } = await signUp(formData.email, formData.password);
      
      if (error) {
        // Check if it's an email already registered error
        if (error.message === 'Email already registered') {
          Alert.alert('Error', 'Email already registered');
        } else {
          showToast(error.message);
        }
        return;
      }
      
      if (data?.user) {
        try {
          console.log('Creating user profile in database');
          
          // Create user profile in the users table
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              first_name: formData.firstName,
              last_name: formData.lastName,
              zip_code: formData.zipCode,
              city: formData.city,
              state: formData.state,
              address_line_1: formData.address,
              autoimmune_diseases: formData.autoimmuneDiseases,
            });
            
          if (userError) {
            console.error('User profile creation error:', userError);
            showToast('Failed to create user profile: ' + userError.message);
            return;
          }
          
          console.log('User profile created successfully');
          setShowVerifiedModal(true);
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
          showToast('An error occurred while creating your profile');
          return;
        }
      }

        // Save patient profile data
        const autoimmuneDiseaseText = formData.autoimmuneDiseases.join(', ');
      try {
        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            user_id: data.user.id,
            chronic_conditions: autoimmuneDiseaseText,
          });

        if (patientError) {
          console.error('Patient profile error:', patientError);
        }

        setShowVerifiedModal(true);
      } catch (error) {
        console.error('Patient profile error:', error);
        showToast('An error occurred while creating your profile');
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={['#3B82F6', '#1E40AF']}
            style={styles.header}
          >
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to start your health journey</Text>
          </LinearGradient>

          <View style={styles.form}>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <User color="#6B7280" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <User color="#6B7280" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Mail color="#6B7280" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock color="#6B7280" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
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

            <View style={styles.inputContainer}>
              <Lock color="#6B7280" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                {showConfirmPassword ? (
                  <EyeOff color="#6B7280" size={20} />
                ) : (
                  <Eye color="#6B7280" size={20} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
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
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  halfInput: {
    width: '48%',
    marginBottom: 0,
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
  eyeIcon: {
    padding: 4,
  },
  signupButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  signupButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
});