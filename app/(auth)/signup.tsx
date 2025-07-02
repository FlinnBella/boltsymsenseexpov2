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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { User, Mail, ChevronLeft, Check } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import VerifiedModal from '@/components/Modal/VerifiedModal';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeColors } from '@/stores/useThemeStore';

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
  const [activeStep, setActiveStep] = useState(1);
  const [previousStep, setPreviousStep] = useState(1);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressAutocompleted, setAddressAutocompleted] = useState(false);
  const colors = useThemeColors();
  
  // Zustand store hooks
  const { signUp, signInWithGoogle, signInWithFacebook } = useUserStore();
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

  const handleSignup = async () => {
    setLoading(true);
    
    try {
      console.log('Starting signup process');
      
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        zip_code: formData.zipCode,
        city: formData.city,
        state: formData.state,
        address_line_1: formData.address,
        autoimmune_diseases: formData.autoimmuneDiseases,
      };

      const { data, error } = await signUp(formData.email, formData.password, userData);
      
      if (error) {
        throw new Error(error.message);
      }

      console.log('Signup successful');
      setLoading(false);
      setShowVerifiedModal(true);

    } catch (error) {
      console.error('Signup error:', error);
      setLoading(false);
      showToast(`Signup failed: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);

    if (error) {
      Alert.alert('Google Sign-Up Failed', error.message);
    }
  };

  const handleFacebookSignUp = async () => {
    setLoading(true);
    const { error } = await signInWithFacebook();
    setLoading(false);

    if (error) {
      Alert.alert('Facebook Sign-Up Failed', error.message);
    }
  };

  const handleModalClose = () => {
    setShowVerifiedModal(false);
    router.push('/(auth)/login');
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
        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
          <User color="#6B7280" size={20} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="First Name"
            placeholderTextColor="#9CA3AF"
            value={formData.firstName}
            onChangeText={(value) => updateFormData('firstName', value)}
            autoCapitalize="words"
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
          <User color="#6B7280" size={20} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
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
      <Text style={styles.stepTitle}>What autoimmune diseases do you need help with?</Text>
      <Text style={styles.stepSubtitle}>Select any that apply to you</Text>

      <View style={styles.diseasesContainer}>
        {AUTOIMMUNE_DISEASES.map((disease) => (
          <TouchableOpacity
            key={disease.name}
            style={[
              styles.diseaseBubble,
              formData.autoimmuneDiseases.includes(disease.name) && [styles.diseaseBubbleSelected, { backgroundColor: colors.primary }],
            ]}
            onPress={() => handleDiseaseToggle(disease.name)}
          >
            <Text style={styles.diseaseEmoji}>{disease.emoji}</Text>
            <Text
              style={[
                styles.diseaseText,
                formData.autoimmuneDiseases.includes(disease.name) && styles.diseaseTextSelected,
              ]}
            >
              {disease.name}
            </Text>
            {formData.autoimmuneDiseases.includes(disease.name) && (
              <Check color="white" size={16} style={styles.diseaseCheck} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={FadeInRight.duration(400)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Where are you located?</Text>
      <Text style={styles.stepSubtitle}>We'll help you find nearby healthcare providers</Text>

      <View style={styles.form}>
        <AddressAutocomplete
          value={formData.address}
          onChangeText={handleAddressChange}
          onAddressSelect={handleAddressSelect}
          placeholder="Start typing your address..."
          style={styles.addressAutocomplete}
        />

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth, { backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.input, addressAutocompleted ? styles.disabledInput : null, { color: colors.text }]}
              placeholder="ZIP Code"
              placeholderTextColor="#9CA3AF"
              value={formData.zipCode}
              onChangeText={(value) => updateFormData('zipCode', value)}
              keyboardType="numeric"
              maxLength={5}
              editable={!addressAutocompleted}
            />
          </View>

          <View style={[styles.inputContainer, styles.halfWidth, { backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.input, styles.disabledInput, { color: colors.textSecondary }]}
              placeholder="City"
              placeholderTextColor="#9CA3AF"
              value={formData.city}
              editable={false}
            />
          </View>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
          <TextInput
            style={[styles.input, styles.disabledInput, { color: colors.textSecondary }]}
            placeholder="State"
            placeholderTextColor="#9CA3AF"
            value={formData.state}
            editable={false}
          />
        </View>

        {addressAutocompleted && (
          <Text style={styles.autocompleteNote}>
            ✅ Address auto-filled. Edit the address above to make changes.
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
        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
          <Mail color="#6B7280" size={20} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Password (8+ chars, mixed case, number)"
            placeholderTextColor="#9CA3AF"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Confirm Password"
            placeholderTextColor="#9CA3AF"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/*<View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={[styles.socialButton, styles.googleButton]} 
            onPress={handleGoogleSignUp}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.socialButton, styles.facebookButton]} 
            onPress={handleFacebookSignUp}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>Facebook</Text>
          </TouchableOpacity>
        </View>*/}
      </View>
    </Animated.View>
  );

  const isNextDisabled = () => {
    switch (activeStep) {
      case 1:
        return !formData.firstName.trim() || !formData.lastName.trim();
      case 2:
        return formData.autoimmuneDiseases.length === 0;
      case 3:
        return !formData.address.trim() || !formData.zipCode.trim() || !formData.city || !formData.state;
      case 4:
        return !formData.email.trim() || !formData.password || !formData.confirmPassword;
      default:
        return true;
    }
  };

  return (
    <LinearGradient colors={[colors.primary, '#10B981']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            
            {activeStep === 2 && (
              <Text style={styles.moreDiseasesText}>More diseases will be available soon!</Text>
            )}
            
            <View style={styles.buttonContainer}>
              {activeStep > 1 && (
                <TouchableOpacity
                  style={styles.backButtonSecondary}
                  onPress={handleBack}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.button,
                  activeStep > 1 ? styles.buttonHalf : styles.buttonFull,
                  (isNextDisabled() || loading) && styles.buttonDisabled
                ]}
                onPress={handleNext}
                disabled={isNextDisabled() || loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : activeStep === 4 ? 'Create Account' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>

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
        onClose={handleModalClose}
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
  },
  disabledInput: {
    color: '#9CA3AF',
    backgroundColor: '#F9FAFB',
  },
  addressAutocomplete: {
    marginBottom: 0,
  },
  autocompleteNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  diseasesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  diseaseBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 6,
    width: 150,
    height: 80,
    justifyContent: 'center',
  },
  diseaseBubbleSelected: {
    borderColor: 'white',
  },
  diseaseEmoji: {
    fontSize: 16,
  },
  diseaseText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  diseaseTextSelected: {
    color: 'white',
  },
  diseaseCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  moreDiseasesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 16,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  socialButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonHalf: {
    flex: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  backButtonSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
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