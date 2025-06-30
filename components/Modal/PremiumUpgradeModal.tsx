import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Crown, Check, Star, Zap, Shield } from 'lucide-react-native';
import { PREMIUM_PLANS, formatPrice } from '@/lib/stripe';
import { useUserProfile } from '@/stores/useUserStore';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgradeSuccess?: () => void;
}

export default function PremiumUpgradeModal({ 
  visible, 
  onClose, 
  onUpgradeSuccess 
}: PremiumUpgradeModalProps) {
  const userProfile = useUserProfile();
  const { upgradeToPremiun, isLoading } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState(PREMIUM_PLANS[0]);

  const handleUpgrade = async () => {
    if (!userProfile?.email || !userProfile?.id) {
      Alert.alert('Error', 'Please log in to upgrade to premium');
      return;
    }

    try {
      const result = await upgradeToPremiun(
        userProfile.id,
        userProfile.email,
        `${userProfile.first_name} ${userProfile.last_name}`,
        selectedPlan.id
      );

      if (result.success) {
        Alert.alert(
          'Upgrade Successful!',
          'Welcome to SymSense Premium! You now have access to all premium features.',
          [
            {
              text: 'Continue',
              onPress: () => {
                onUpgradeSuccess?.();
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Upgrade Failed',
          result.error || 'There was an issue processing your upgrade. Please try again or contact support.'
        );
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      Alert.alert(
        'Upgrade Failed',
        'There was an issue processing your upgrade. Please try again or contact support.'
      );
    }
  };

  const PlanCard = ({ plan, isSelected, onSelect }: any) => (
    <TouchableOpacity
      style={[
        styles.planCard,
        isSelected && styles.planCardSelected
      ]}
      onPress={() => onSelect(plan)}
    >
      <LinearGradient
        colors={isSelected ? ['#FFD700', '#FFA500'] : ['#F8F9FA', '#FFFFFF']}
        style={styles.planCardGradient}
      >
        <View style={styles.planHeader}>
          <Text style={[styles.planName, isSelected && styles.planNameSelected]}>
            {plan.name}
          </Text>
          {plan.interval === 'year' && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save 17%</Text>
            </View>
          )}
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={[styles.price, isSelected && styles.priceSelected]}>
            {formatPrice(plan.price)}
          </Text>
          <Text style={[styles.interval, isSelected && styles.intervalSelected]}>
            /{plan.interval}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Check color="white" size={16} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header with gradient */}
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            style={styles.header}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="white" size={24} />
            </TouchableOpacity>
            
            <Crown color="white" size={48} style={styles.crownIcon} />
            
            <Text style={styles.title}>Upgrade to Premium</Text>
            <Text style={styles.subtitle}>
              Want more time to talk with your doctor? Upgrade now!
            </Text>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Plan Selection */}
            <View style={styles.plansContainer}>
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>
              <View style={styles.plansGrid}>
                {PREMIUM_PLANS.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isSelected={selectedPlan.id === plan.id}
                    onSelect={setSelectedPlan}
                  />
                ))}
              </View>
            </View>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <Text style={styles.sectionTitle}>Premium Features</Text>
              <View style={styles.featuresList}>
                {selectedPlan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      {index === 0 && <Zap color="#FFD700" size={20} />}
                      {index === 1 && <Star color="#FFD700" size={20} />}
                      {index === 2 && <Crown color="#FFD700" size={20} />}
                      {index === 3 && <Shield color="#FFD700" size={20} />}
                      {(index >= 4) && <Check color="#FFD700" size={20} />}
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Upgrade Button */}
            <View style={styles.upgradeContainer}>
              <TouchableOpacity
                style={[styles.upgradeButton, isLoading && styles.upgradeButtonDisabled]}
                onPress={handleUpgrade}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.upgradeButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Crown color="white" size={20} />
                      <Text style={styles.upgradeButtonText}>
                        Upgrade to Premium
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <Text style={styles.disclaimer}>
                Cancel anytime. No hidden fees. Secure payment processing.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownIcon: {
    marginBottom: 16,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  plansContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  plansGrid: {
    gap: 12,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  planCardSelected: {
    borderColor: '#FFD700',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  planCardGradient: {
    padding: 20,
    position: 'relative',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  planNameSelected: {
    color: 'white',
  },
  savingsBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  priceSelected: {
    color: 'white',
  },
  interval: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  intervalSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 22,
  },
  upgradeContainer: {
    paddingBottom: 40,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});