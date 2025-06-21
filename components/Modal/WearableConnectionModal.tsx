import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Smartphone, X } from 'lucide-react-native';

interface WearableConnectionModalProps {
  visible: boolean;
  onConnect: () => void;
  onDismiss: () => void;
}

export default function WearableConnectionModal({ 
  visible, 
  onConnect, 
  onDismiss 
}: WearableConnectionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          
          <Smartphone color="#F97316" size={64} style={styles.icon} />
          
          <Text style={styles.title}>Connect Your Wearable</Text>
          
          <Text style={styles.message}>
            Connect your fitness tracker or smartwatch to get personalized health insights, 
            track your progress automatically, and receive better health recommendations.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
              <Text style={styles.connectButtonText}>Connect Device</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.skipButton} onPress={onDismiss}>
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  icon: {
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 28,
    marginHorizontal: 4,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  connectButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});