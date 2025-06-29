import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Save, Apple } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/stores/useUserStore';

interface FoodLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function FoodLogModal({ visible, onClose, onSave }: FoodLogModalProps) {
  const userProfile = useUserProfile();
  const [foodName, setFoodName] = useState('');
  const [negativeEffects, setNegativeEffects] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!foodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('food_logs')
        .insert({
          user_id: userProfile?.id,
          food_name: foodName.trim(),
          negative_effects: negativeEffects.trim() || null,
        });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Food logged successfully');
      setFoodName('');
      setNegativeEffects('');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error logging food:', error);
      Alert.alert('Error', 'Failed to log food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFoodName('');
    setNegativeEffects('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X color="white" size={24} />
            </TouchableOpacity>
            
            <Apple color="white" size={32} style={styles.icon} />
            
            <Text style={styles.title}>Log Food</Text>
            <Text style={styles.subtitle}>Track what you eat and how it affects you</Text>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Food Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Pizza, Salad, Coffee"
                placeholderTextColor="#9CA3AF"
                value={foodName}
                onChangeText={setFoodName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Negative Effects (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="e.g., Bloating, Headache, Fatigue, Allergic reaction..."
                placeholderTextColor="#9CA3AF"
                value={negativeEffects}
                onChangeText={setNegativeEffects}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.tipContainer}>
              <Text style={styles.tipTitle}>💡 Tracking Tips</Text>
              <Text style={styles.tipText}>
                • Log foods immediately after eating{'\n'}
                • Note any symptoms within 2-4 hours{'\n'}
                • Include ingredients if you suspect allergies{'\n'}
                • Track portion sizes for better insights
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading || !foodName.trim()}
            >
              <Save color="white" size={20} />
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Log Food'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  content: {
    padding: 24,
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
  tipContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#F59E0B',
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