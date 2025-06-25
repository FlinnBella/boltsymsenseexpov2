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
import { ArrowLeft, Save, CircleAlert as AlertCircle } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/stores/useUserStore';

const SEVERITY_LEVELS = [
  { value: 1, label: 'Very Mild', color: '#10B981' },
  { value: 2, label: 'Mild', color: '#34D399' },
  { value: 3, label: 'Mild-Moderate', color: '#6EE7B7' },
  { value: 4, label: 'Moderate', color: '#FCD34D' },
  { value: 5, label: 'Moderate', color: '#FBBF24' },
  { value: 6, label: 'Moderate-Severe', color: '#F59E0B' },
  { value: 7, label: 'Severe', color: '#F97316' },
  { value: 8, label: 'Very Severe', color: '#EA580C' },
  { value: 9, label: 'Extremely Severe', color: '#EF4444' },
  { value: 10, label: 'Unbearable', color: '#DC2626' },
];

export default function LogSymptomsScreen() {
  const userProfile = useUserProfile();
  const [symptomName, setSymptomName] = useState('');
  const [severity, setSeverity] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!symptomName.trim()) {
      Alert.alert('Error', 'Please enter a symptom name');
      return;
    }

    if (severity === null) {
      Alert.alert('Error', 'Please select a severity level');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('symptom_logs')
        .insert({
          user_id: userProfile?.id,
          symptom_name: symptomName.trim(),
          severity,
          description: description.trim() || null,
        });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Symptom logged successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error logging symptom:', error);
      Alert.alert('Error', 'Failed to log symptom. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Log Symptoms</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInRight.delay(200).duration(600)} style={styles.section}>
          <View style={styles.iconContainer}>
            <AlertCircle color="#EF4444" size={24} />
          </View>
          <Text style={styles.sectionTitle}>Symptom Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Symptom Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Headache, Nausea, Fatigue"
              placeholderTextColor="#9CA3AF"
              value={symptomName}
              onChangeText={setSymptomName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Describe your symptom in more detail..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(400).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Severity Level *</Text>
          <Text style={styles.sectionSubtitle}>Rate your symptom from 1 (very mild) to 10 (unbearable)</Text>
          
          <View style={styles.severityGrid}>
            {SEVERITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.severityButton,
                  { backgroundColor: severity === level.value ? level.color : '#F3F4F6' },
                ]}
                onPress={() => setSeverity(level.value)}
              >
                <Text
                  style={[
                    styles.severityNumber,
                    { color: severity === level.value ? 'white' : '#374151' },
                  ]}
                >
                  {level.value}
                </Text>
                <Text
                  style={[
                    styles.severityLabel,
                    { color: severity === level.value ? 'white' : '#6B7280' },
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
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
              {loading ? 'Saving...' : 'Save Symptom'}
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
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  severityButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  severityNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  severityLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#EF4444',
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