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
import { House, Save, Pill } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/stores/useUserStore';
import { useThemeColors } from '@/stores/useThemeStore';

export default function AddMedicationScreen() {
  const userProfile = useUserProfile();
  const colors = useThemeColors();
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
        { text: 'OK', onPress: () => router.push('/(tabs)/stats') }
      ]);
    } catch (error) {
      console.error('Error logging medication:', error);
      Alert.alert('Error', 'Failed to log medication. Please try again.');
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Medication</Text>
          <View style={styles.placeholder} />
        </View>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInRight.delay(200).duration(600)} style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
            <Pill color={colors.success} size={24} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Medication Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Medication Name *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Ibuprofen, Aspirin, Vitamin D"
              placeholderTextColor={colors.textSecondary}
              value={medicationName}
              onChangeText={setMedicationName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Dosage (Optional)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 200mg, 1 tablet, 2 capsules"
              placeholderTextColor={colors.textSecondary}
              value={dosage}
              onChangeText={setDosage}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Any additional notes about this medication..."
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(400).duration(600)} style={[styles.infoSection, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
          <Text style={[styles.infoTitle, { color: colors.primary }]}>💡 Medication Tracking Tips</Text>
          <View style={styles.tipsList}>
            <Text style={[styles.tipItem, { color: colors.primary }]}>• Log medications as soon as you take them</Text>
            <Text style={[styles.tipItem, { color: colors.primary }]}>• Include the exact dosage for accurate tracking</Text>
            <Text style={[styles.tipItem, { color: colors.primary }]}>• Note any side effects or reactions</Text>
            <Text style={[styles.tipItem, { color: colors.primary }]}>• Set reminders for regular medications</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(600).duration(600)} style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.success }, loading && styles.saveButtonDisabled]}
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
  infoSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
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