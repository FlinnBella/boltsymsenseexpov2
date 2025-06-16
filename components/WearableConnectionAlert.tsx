import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Smartphone, X } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { getTerraConnections } from '@/lib/api/terra';
import { supabase } from '@/lib/supabase';

interface WearableConnectionAlertProps {
  onConnect: () => void;
}

export default function WearableConnectionAlert({ onConnect }: WearableConnectionAlertProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkWearableConnection();
  }, []);

  const checkWearableConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const connections = await getTerraConnections(user.id);
      const hasActiveConnection = connections.some(conn => conn.is_active);
      
      setShowAlert(!hasActiveConnection);
    } catch (error) {
      console.error('Error checking wearable connection:', error);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowAlert(false);
  };

  const handleConnect = () => {
    setShowAlert(false);
    onConnect();
  };

  if (isLoading || !showAlert) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutDown.duration(300)}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Smartphone color="#F97316" size={24} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Connect Your Wearable</Text>
          <Text style={styles.message}>
            Connect your fitness tracker or smartwatch to get personalized health insights and track your progress.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <X color="#6B7280" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});