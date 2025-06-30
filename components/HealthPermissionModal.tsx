import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, X, Smartphone } from 'lucide-react-native';
import { useThemeColors } from '@/stores/useThemeStore';

interface HealthPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export default function HealthPermissionModal({
  visible,
  onAllow,
  onDeny,
}: HealthPermissionModalProps) {
  const colors = useThemeColors();

  const getHealthServiceName = () => {
    return Platform.OS === 'ios' ? 'HealthKit' : 'Health Connect';
  };

  const getHealthServiceDescription = () => {
    if (Platform.OS === 'ios') {
      return 'Connect to Apple HealthKit to automatically track your health metrics including steps, heart rate, calories, and sleep data.';
    }
    return 'Connect to Android Health Connect to automatically track your health metrics including steps, heart rate, calories, and sleep data.';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDeny}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={[colors.primary, '#10B981']}
          style={styles.modalContainer}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onDeny}>
            <X color="white" size={24} />
          </TouchableOpacity>

          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Heart color="white" size={48} />
          </View>

          <Text style={styles.title}>Enable Health Tracking</Text>

          <Text style={styles.description}>
            {getHealthServiceDescription()}
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Smartphone color="white" size={20} />
              <Text style={styles.benefitText}>Automatic data sync</Text>
            </View>
            <View style={styles.benefitItem}>
              <Heart color="white" size={20} />
              <Text style={styles.benefitText}>Real-time health insights</Text>
            </View>
            <View style={styles.benefitItem}>
              <Heart color="white" size={20} />
              <Text style={styles.benefitText}>Personalized recommendations</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.allowButton]}
              onPress={onAllow}
            >
              <Text style={styles.allowButtonText}>
                Connect to {getHealthServiceName()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.denyButton]}
              onPress={onDeny}
            >
              <Text style={styles.denyButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.privacyNote}>
            Your health data is encrypted and never shared with third parties.
          </Text>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
    marginLeft: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  allowButton: {
    backgroundColor: 'white',
  },
  denyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  allowButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#064E3B',
  },
  denyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  privacyNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});