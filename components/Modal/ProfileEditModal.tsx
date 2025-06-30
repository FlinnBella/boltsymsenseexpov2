import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Save } from 'lucide-react-native';
import { PatientProfile, createOrUpdatePatientProfile } from '@/lib/api/profile';
import { useUserStore, UserProfile } from '@/stores/useUserStore';

// TODO:  FIGURE THE SLOP OUT LATER

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  patientProfile: PatientProfile | null;
  onSave: () => void;
}

export default function ProfileEditModal({
  visible,
  onClose,
  userProfile,
  patientProfile,
  onSave,
}: ProfileEditModalProps) {
  const { updateUserProfile, initializeUserData } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // User profile fields
    first_name: userProfile.first_name || '',
    last_name: userProfile.last_name || '',
    middle_name: userProfile.middle_name || '',
    phone: userProfile.phone || '',
    date_of_birth: userProfile.date_of_birth || '',
    gender: userProfile.gender || '',
    address_line_1: userProfile.address_line_1 || '',
    address_line_2: userProfile.address_line_2 || '',
    city: userProfile.city || '',
    state: userProfile.state || '',
    zip_code: userProfile.zip_code || '',
    country: userProfile.country || 'United States',
    
    // Patient profile fields
    ethnicity: patientProfile?.ethnicity || '',
    race: patientProfile?.race || '',
    preferred_language: patientProfile?.preferred_language || 'English',
    marital_status: patientProfile?.marital_status || '',
    occupation: patientProfile?.occupation || '',
    emergency_contact_name: patientProfile?.emergency_contact_name || '',
    emergency_contact_relationship: patientProfile?.emergency_contact_relationship || '',
    emergency_contact_phone: patientProfile?.emergency_contact_phone || '',
    emergency_contact_email: patientProfile?.emergency_contact_email || '',
    insurance_provider: patientProfile?.insurance_provider || '',
    insurance_policy_number: patientProfile?.insurance_policy_number || '',
    insurance_group_number: patientProfile?.insurance_group_number || '',
    blood_type: patientProfile?.blood_type || '',
    allergies: patientProfile?.allergies || '',
    chronic_conditions: patientProfile?.chronic_conditions || '',
    current_medications: patientProfile?.current_medications || '',
    family_medical_history: patientProfile?.family_medical_history || '',
    height_inches: patientProfile?.height_inches?.toString() || '',
    weight_pounds: patientProfile?.weight_pounds?.toString() || '',
    preferred_provider_gender: patientProfile?.preferred_provider_gender || '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update user profile
      const userUpdates = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || undefined,
        phone: formData.phone || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        address_line_1: formData.address_line_1 || undefined,
        address_line_2: formData.address_line_2 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip_code: formData.zip_code || undefined,
        country: formData.country || undefined,
      };

      await updateUserProfile(userUpdates);

      // Update patient profile
      const patientUpdates = {
        ethnicity: formData.ethnicity || undefined,
        race: formData.race || undefined,
        preferred_language: formData.preferred_language,
        marital_status: formData.marital_status || undefined,
        occupation: formData.occupation || undefined,
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_relationship: formData.emergency_contact_relationship || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
        emergency_contact_email: formData.emergency_contact_email || undefined,
        insurance_provider: formData.insurance_provider || undefined,
        insurance_policy_number: formData.insurance_policy_number || undefined,
        insurance_group_number: formData.insurance_group_number || undefined,
        blood_type: formData.blood_type || undefined,
        allergies: formData.allergies || undefined,
        chronic_conditions: formData.chronic_conditions || undefined,
        current_medications: formData.current_medications || undefined,
        family_medical_history: formData.family_medical_history || undefined,
        height_inches: formData.height_inches ? parseInt(formData.height_inches) : undefined,
        weight_pounds: formData.weight_pounds ? parseFloat(formData.weight_pounds) : undefined,
        preferred_provider_gender: formData.preferred_provider_gender || undefined,
      };

      await createOrUpdatePatientProfile(userProfile.id, patientUpdates);

      // Refresh user data using Zustand
      await initializeUserData();

      Alert.alert('Success', 'Profile updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const FormField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    multiline = false,
    keyboardType = 'default' as any
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    multiline?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline ? styles.multilineInput : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color="#6B7280" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            disabled={loading}
          >
            <Save color="white" size={20} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <FormSection title="Personal Information">
            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  label="First Name"
                  value={formData.first_name}
                  onChangeText={(text) => updateField('first_name', text)}
                  placeholder="Enter first name"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Last Name"
                  value={formData.last_name}
                  onChangeText={(text) => updateField('last_name', text)}
                  placeholder="Enter last name"
                />
              </View>
            </View>

            <FormField
              label="Middle Name"
              value={formData.middle_name}
              onChangeText={(text) => updateField('middle_name', text)}
              placeholder="Enter middle name (optional)"
            />

            <FormField
              label="Phone"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />

            <FormField
              label="Date of Birth"
              value={formData.date_of_birth}
              onChangeText={(text) => updateField('date_of_birth', text)}
              placeholder="YYYY-MM-DD"
            />

            <FormField
              label="Gender"
              value={formData.gender}
              onChangeText={(text) => updateField('gender', text)}
              placeholder="Enter gender"
            />
          </FormSection>

          <FormSection title="Address">
            <FormField
              label="Address Line 1"
              value={formData.address_line_1}
              onChangeText={(text) => updateField('address_line_1', text)}
              placeholder="Enter street address"
            />

            <FormField
              label="Address Line 2"
              value={formData.address_line_2}
              onChangeText={(text) => updateField('address_line_2', text)}
              placeholder="Apartment, suite, etc. (optional)"
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  label="City"
                  value={formData.city}
                  onChangeText={(text) => updateField('city', text)}
                  placeholder="Enter city"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="State"
                  value={formData.state}
                  onChangeText={(text) => updateField('state', text)}
                  placeholder="Enter state"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  label="ZIP Code"
                  value={formData.zip_code}
                  onChangeText={(text) => updateField('zip_code', text)}
                  placeholder="Enter ZIP code"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Country"
                  value={formData.country}
                  onChangeText={(text) => updateField('country', text)}
                  placeholder="Enter country"
                />
              </View>
            </View>
          </FormSection>

          <FormSection title="Medical Information">
            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  label="Ethnicity"
                  value={formData.ethnicity}
                  onChangeText={(text) => updateField('ethnicity', text)}
                  placeholder="Enter ethnicity"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Race"
                  value={formData.race}
                  onChangeText={(text) => updateField('race', text)}
                  placeholder="Enter race"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  label="Blood Type"
                  value={formData.blood_type}
                  onChangeText={(text) => updateField('blood_type', text)}
                  placeholder="e.g., A+, O-"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Preferred Language"
                  value={formData.preferred_language}
                  onChangeText={(text) => updateField('preferred_language', text)}
                  placeholder="Enter language"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  label="Height (inches)"
                  value={formData.height_inches}
                  onChangeText={(text) => updateField('height_inches', text)}
                  placeholder="Enter height"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Weight (lbs)"
                  value={formData.weight_pounds}
                  onChangeText={(text) => updateField('weight_pounds', text)}
                  placeholder="Enter weight"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <FormField
              label="Allergies"
              value={formData.allergies}
              onChangeText={(text) => updateField('allergies', text)}
              placeholder="List any allergies"
              multiline
            />

            <FormField
              label="Chronic Conditions"
              value={formData.chronic_conditions}
              onChangeText={(text) => updateField('chronic_conditions', text)}
              placeholder="List any chronic conditions"
              multiline
            />

            <FormField
              label="Current Medications"
              value={formData.current_medications}
              onChangeText={(text) => updateField('current_medications', text)}
              placeholder="List current medications"
              multiline
            />

            <FormField
              label="Family Medical History"
              value={formData.family_medical_history}
              onChangeText={(text) => updateField('family_medical_history', text)}
              placeholder="Describe family medical history"
              multiline
            />
          </FormSection>

          <FormSection title="Emergency Contact">
            <FormField
              label="Emergency Contact Name"
              value={formData.emergency_contact_name}
              onChangeText={(text) => updateField('emergency_contact_name', text)}
              placeholder="Enter contact name"
            />

            <FormField
              label="Relationship"
              value={formData.emergency_contact_relationship}
              onChangeText={(text) => updateField('emergency_contact_relationship', text)}
              placeholder="e.g., Spouse, Parent, Sibling"
            />

            <FormField
              label="Emergency Contact Phone"
              value={formData.emergency_contact_phone}
              onChangeText={(text) => updateField('emergency_contact_phone', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />

            <FormField
              label="Emergency Contact Email"
              value={formData.emergency_contact_email}
              onChangeText={(text) => updateField('emergency_contact_email', text)}
              placeholder="Enter email address"
              keyboardType="email-address"
            />
          </FormSection>

          <FormSection title="Insurance Information">
            <FormField
              label="Insurance Provider"
              value={formData.insurance_provider}
              onChangeText={(text) => updateField('insurance_provider', text)}
              placeholder="Enter insurance provider"
            />

            <FormField
              label="Policy Number"
              value={formData.insurance_policy_number}
              onChangeText={(text) => updateField('insurance_policy_number', text)}
              placeholder="Enter policy number"
            />

            <FormField
              label="Group Number"
              value={formData.insurance_group_number}
              onChangeText={(text) => updateField('insurance_group_number', text)}
              placeholder="Enter group number"
            />
          </FormSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
});