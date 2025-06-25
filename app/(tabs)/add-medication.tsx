import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Save, Pill } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/stores/useUserStore';

export default function AddMedicationScreen() {
  const userProfile = useUserProfile();
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!medicationName.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('medication_logs')
        .insert({
          user_id: userProfile?.id,
          medication_name: medicationName.trim(),
          dosage: dosage.trim() || null,
          taken_at: new Date().toISOString(),
          notes: notes.trim() || null,
        });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Medication logged successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error logging medication:', error);
      Alert.alert('Error', 'Failed to log medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Medication</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInRight.delay(200).duration(600)} style={styles.section}>
          <View style={styles.iconContainer}>
            <Pill color="#10B981" size={24} />
          </View>
          <Text style={styles.sectionTitle}>Medication Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Medication Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Ibuprofen, Aspirin, Vitamin D"
              placeholderTextColor="#9CA3AF"
              value={medicationName}
              onChangeText={setMedicationName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Dosage (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 200mg, 1 tablet, 2 capsules"
              placeholderTextColor="#9CA3AF"
              value={dosage}
              onChangeText={setDosage}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Any additional notes about this medication..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(400).duration(600)} style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Medication Tracking Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Log medications as soon as you take them</Text>
            <Text style={styles.tipItem}>• Include the exact dosage for accurate tracking</Text>
            <Text style={styles.tipItem}>• Note any side effects or reactions</Text>
            <Text style={styles.tipItem}>• Set reminders for regular medications</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(600).duration(600)} style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Save color="white" size={20} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Log Medication'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    marginBottom: 24,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1E40AF',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});