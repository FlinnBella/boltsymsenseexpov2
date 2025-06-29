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
import { House, Save, CircleAlert as AlertCircle } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/stores/useUserStore';
import { useThemeColors } from '@/stores/useThemeStore';

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
  const colors = useThemeColors();
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
        { text: 'OK', onPress: () => router.push('/(tabs)/stats') }
      ]);
    } catch (error) {
      console.error('Error logging symptom:', error);
      Alert.alert('Error', 'Failed to log symptom. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <Animated.View entering={FadeInUp.duration(600)} style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/stats')} style={[styles.homeButton, { backgroundColor: colors.background }]}>
            <House color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Log Symptoms</Text>
          <View style={styles.placeholder} />
        </View>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInRight.delay(200).duration(600)} style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
            <AlertCircle color={colors.error} size={24} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Symptom Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Symptom Name *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Headache, Nausea, Fatigue"
              placeholderTextColor={colors.textSecondary}
              value={symptomName}
              onChangeText={setSymptomName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe your symptom in more detail..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(400).duration(600)} style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Severity Level *</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Rate your symptom from 1 (very mild) to 10 (unbearable)</Text>
          
          <View style={styles.severityGrid}>
            {SEVERITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.severityButton,
                  { 
                    backgroundColor: severity === level.value ? level.color : colors.surface,
                    borderColor: severity === level.value ? level.color : colors.border,
                  },
                ]}
                onPress={() => setSeverity(level.value)}
              >
                <Text
                  style={[
                    styles.severityNumber,
                    { color: severity === level.value ? 'white' : colors.text },
                  ]}
                >
                  {level.value}
                </Text>
                <Text
                  style={[
                    styles.severityLabel,
                    { color: severity === level.value ? 'white' : colors.textSecondary },
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
            style={[styles.saveButton, { backgroundColor: colors.error }, loading && styles.saveButtonDisabled]}
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
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  severityButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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