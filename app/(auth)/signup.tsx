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
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Eye, EyeOff, MapPin, ChevronDown } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import VerifiedModal from '@/components/Modal/VerifiedModal';
import { stateOptions } from '@/app/etc/SetFormInfo';

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    zipCode: '',
    city: '',
    state: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const handleSignup = async () => {
    const { firstName, lastName, email, password, confirmPassword, zipCode, city, state, address } = formData;
    console.log(formData);

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!zipCode || !city || !state || !address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('signing up');
      const { data,error } = await supabase.auth.signUp({
        email,
        password,
      });
      setLoading(false);
      console.log('data');
      const signupData = data;
      console.log(signupData)
      // TODO: Replace this with a modal!
      //router.replace('/(auth)/info');
      if (signupData) {
        try {
        const { data, error: userError } = await supabase.from('users').insert({
          id: signupData.user?.id,
          email: signupData.user?.email,
          first_name: firstName,
          last_name: lastName,
          zip_code: zipCode,
          city: city,
          state: state,
          address_line_1: address,
        });
        console.log('public users update success');
        console.log(data);
          if (userError) {
            Alert.alert('Error', userError.message);
          }
        } catch (error) {
          Alert.alert('Error', 'An unexpected error occurred');
        }
      }
      if (error) {
        Alert.alert('Signup Failed', error.message);
      } else {
        setShowVerifiedModal(true);
        Alert.alert(
          'Success',
          'Account created successfully! Please check your email for verification.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeStep === 1 ? <Animated.View entering={FadeInUp.duration(800)} style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join your health journey today</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <User color="#6B7280" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.firstName}
                    onChangeText={(value) => updateFormData('firstName', value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <User color="#6B7280" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.lastName}
                    onChangeText={(value) => updateFormData('lastName', value)}
                  />
                </View>
              </View>

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
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color="#6B7280" size={20} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
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

              <View style={styles.inputContainer}>
                <Lock color="#6B7280" size={20} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm Password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
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
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={() => {
                  if (formData.firstName && formData.lastName && formData.email && formData.password && formData.confirmPassword) {
                    setActiveStep(2);
                  } else {
                    Alert.alert('Error', 'Please fill in all fields');
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Next' : 'Next'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  router.push('/(auth)/login');
                }}
              >
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View> : null}
          {activeStep === 2 ? <Animated.View entering={FadeInUp.duration(800)} style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Location</Text>
              <Text style={styles.subtitle}>Enter your location to get started</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  {/* <User color="#6B7280" size={20} style={styles.inputIcon} /> */}
                  <TextInput
                    style={styles.input}
                    placeholder="Zip Code"
                    placeholderTextColor="#9CA3AF"
                    value={formData.zipCode}
                    onChangeText={(value) => updateFormData('zipCode', value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  {/*<User color="#6B7280" size={20} style={styles.inputIcon} />*/}
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="#9CA3AF"
                    value={formData.city}
                    onChangeText={(value) => updateFormData('city', value)}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowStateDropdown(true)}
              >
                <MapPin color="#6B7280" size={20} style={styles.inputIcon} />
                <Text style={[styles.input, styles.dropdownText, !formData.state ? styles.placeholderText : null]}>
                  {formData.state || 'Select State'}
                </Text>
                <ChevronDown color="#6B7280" size={20} style={styles.dropdownIcon} />
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <MapPin color="#6B7280" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Address"
                  placeholderTextColor="#9CA3AF"
                  value={formData.address}
                  onChangeText={(value) => updateFormData('address', value)}
                  keyboardType="default"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={() => {
                  if (formData.zipCode && formData.city && formData.state && formData.address) {
                    handleSignup();
                  } else {
                    Alert.alert('Error', 'Please fill in all fields');
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  router.push('/(auth)/login');
                }}
              >
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
      <VerifiedModal visible={showVerifiedModal} onClose={() => {
        setShowVerifiedModal(false);
        router.push('/(auth)/login');
      }} />
      
      {/* State Dropdown Modal */}
      <Modal
        visible={showStateDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStateDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity
                onPress={() => setShowStateDropdown(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={stateOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    formData.state === item ? styles.selectedItem : null
                  ]}
                  onPress={() => {
                    updateFormData('state', item);
                    setShowStateDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    formData.state === item ? styles.selectedItemText : null
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  halfWidth: {
    flex: 1,
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
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedItem: {
    backgroundColor: '#EBF4FF',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  selectedItemText: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
});