import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { User, Mail, MapPin, ChevronLeft, Check } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import VerifiedModal from '@/components/Modal/VerifiedModal';
import { getLocationFromZipCode, validateUSZipCode } from '@/lib/zipCodeData';

const MEDICAL_CONDITIONS = [
  'Rheumatoid Arthritis',
  'Type 1 Diabetes',
  'Multiple Sclerosis',
  'Systemic Lupus',
  "Crohn's Disease",
  'None of the above',
  'Other'
];

interface FormData {
  firstName: string;
  lastName: string;
  medicalConditions: string[];
  otherCondition: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupScreen() {
  const [activeStep, setActiveStep] = useState(1);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    medicalConditions: [],
    otherCondition: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Validation Error', message);
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
        if (formData.medicalConditions.length === 0) {
          showToast('Please select at least one option');
          return false;
        }
        if (formData.medicalConditions.includes('Other') && !formData.otherCondition.trim()) {
          showToast('Please specify your other condition');
          return false;
        }
        return true;
      
      case 3:
        const addressRegex = /^[a-zA-Z0-9\s,.-#]+$/;
        
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
        if (!validateUSZipCode(formData.zipCode)) {
          showToast('Please enter a valid US ZIP code');
          return false;
        }
        if (!formData.city || !formData.state) {
          showToast('Invalid ZIP code - city/state not found');
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionToggle = (condition: string) => {
    const currentConditions = [...formData.medicalConditions];
    const index = currentConditions.indexOf(condition);
    
    if (index > -1) {
      currentConditions.splice(index, 1);
      // Clear other condition text if "Other" is deselected
      if (condition === 'Other') {
        updateFormData('otherCondition', '');
      }
    } else {
      // Handle mutual exclusivity with "None of the above"
      if (condition === 'None of the above') {
        updateFormData('medicalConditions', ['None of the above']);
        updateFormData('otherCondition', '');
        return;
      } else if (currentConditions.includes('None of the above')) {
        const noneIndex = currentConditions.indexOf('None of the above');
        currentConditions.splice(noneIndex, 1);
      }
      currentConditions.push(condition);
    }
    
    updateFormData('medicalConditions', currentConditions);
  };

  const handleZipCodeChange = (zipCode: string) => {
    // Only allow numeric input
    const numericZipCode = zipCode.replace(/\D/g, '');
    updateFormData('zipCode', numericZipCode);
    
    if (numericZipCode.length === 5) {
      const locationData = getLocationFromZipCode(numericZipCode);
      if (locationData) {
        updateFormData('city', locationData.city);
        updateFormData('state', locationData.state);
      } else {
        updateFormData('city', '');
        updateFormData('state', '');
      }
    } else {
      updateFormData('city', '');
      updateFormData('state', '');
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        showToast(error.message);
        return;
      }

      if (data.user) {
        // Save user profile data
        const { error: profileError } = await supabase
          .from('users')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            address_line_1: formData.address,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zipCode,
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Save patient profile data
        const medicalConditionsText = formData.medicalConditions.includes('Other') 
          ? [...formData.medicalConditions.filter(c => c !== 'Other'), formData.otherCondition].join(', ')
          : formData.medicalConditions.join(', ');

        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            user_id: data.user.id,
            chronic_conditions: medicalConditionsText,
          });

        if (patientError) {
          console.error('Patient profile error:', patientError);
        }

        setShowVerifiedModal(true);
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToast('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          style={[
            styles.progressDot,
            step <= activeStep ? styles.progressDotActive : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your name?</Text>
      <Text style={styles.stepSubtitle}>Let's start with the basics</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <User color="#6B7280" size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#9CA3AF"
            value={formData.firstName}
            onChangeText={(value) => updateFormData('firstName', value)}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <User color="#6B7280" size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#9CA3AF"
            value={formData.lastName}
            onChangeText={(value) => updateFormData('lastName', value)}
            autoCapitalize="words"
          />
        </View>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Medical Conditions</Text>
      <Text style={styles.stepSubtitle}>Select any that apply to you</Text>

      <View style={styles.conditionsContainer}>
        {MEDICAL_CONDITIONS.map((condition) => (
          <TouchableOpacity
            key={condition}
            style={[
              styles.conditionBubble,
              formData.medicalConditions.includes(condition) && styles.conditionBubbleSelected,
            ]}
            onPress={() => handleConditionToggle(condition)}
          >
            <Text
              style={[
                styles.conditionText,
                formData.medicalConditions.includes(condition) && styles.conditionTextSelected,
              ]}
            >
              {condition}
            </Text>
            {formData.medicalConditions.includes(condition) && (
              <Check color="white" size={16} style={styles.conditionCheck} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {formData.medicalConditions.includes('Other') && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Please specify your condition"
            placeholderTextColor="#9CA3AF"
            value={formData.otherCondition}
            onChangeText={(value) => updateFormData('otherCondition', value)}
            autoCapitalize="sentences"
          />
        </Animated.View>
      )}
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Where are you located?</Text>
      <Text style={styles.stepSubtitle}>We'll help you find nearby healthcare providers</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MapPin color="#6B7280" size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Street Address"
            placeholderTextColor="#9CA3AF"
            value={formData.address}
            onChangeText={(value) => updateFormData('address', value)}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="ZIP Code"
            placeholderTextColor="#9CA3AF"
            value={formData.zipCode}
            onChangeText={handleZipCodeChange}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="City"
              placeholderTextColor="#9CA3AF"
              value={formData.city}
              editable={false}
            />
          </View>

          <View style={[styles.inputContainer, styles.halfWidth]}>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="State"
              placeholderTextColor="#9CA3AF"
              value={formData.state}
              editable={false}
            />
          </View>
        </View>

        {formData.zipCode.length === 5 && !formData.city && (
          <Text style={styles.zipCodeError}>
            ZIP code not found. Please enter a valid US ZIP code.
          </Text>
        )}
      </View>
    </Animated.View>
  );

  const renderStep4 = () => (
    <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create your account</Text>
      <Text style={styles.stepSubtitle}>Get your email verified</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Mail color="#6B7280" size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password (8+ chars, mixed case, number)"
            placeholderTextColor="#9CA3AF"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#9CA3AF"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>
      </View>
    </Animated.View>
  );

  const isNextDisabled = () => {
    switch (activeStep) {
      case 1:
        return !formData.firstName.trim() || !formData.lastName.trim();
      case 2:
        return formData.medicalConditions.length === 0 || 
               (formData.medicalConditions.includes('Other') && !formData.otherCondition.trim());
      case 3:
        return !formData.address.trim() || !formData.zipCode.trim() || !formData.city || !formData.state;
      case 4:
        return !formData.email.trim() || !formData.password || !formData.confirmPassword;
      default:
        return true;
    }
  };

  return (
    <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
            <View style={styles.headerTop}>
              {activeStep > 1 && (
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <ChevronLeft color="white" size={24} />
                </TouchableOpacity>
              )}
              <Text style={styles.stepIndicator}>Step {activeStep} of 4</Text>
            </View>
            {renderProgressBar()}
          </Animated.View>

          <View style={styles.content}>
            {activeStep === 1 && renderStep1()}
            {activeStep === 2 && renderStep2()}
            {activeStep === 3 && renderStep3()}
            {activeStep === 4 && renderStep4()}

            <TouchableOpacity
              style={[styles.button, (isNextDisabled() || loading) && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={isNextDisabled() || loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : activeStep === 4 ? 'Create Account' : 'Next'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <VerifiedModal
        visible={showVerifiedModal}
        onClose={() => {
          setShowVerifiedModal(false);
          router.push('/(auth)/login');
        }}
      />
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: 'white',
  },
  progressDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  disabledInput: {
    color: '#9CA3AF',
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  conditionBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  conditionBubbleSelected: {
    backgroundColor: '#F97316',
    borderColor: 'white',
  },
  conditionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    flex: 1,
  },
  conditionTextSelected: {
    color: 'white',
  },
  conditionCheck: {
    marginLeft: 4,
  },
  zipCodeError: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FCA5A5',
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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