import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  checkPremiumStatus, 
  createPremiumSubscription, 
  cancelPremiumSubscription,
  syncSubscriptionStatus,
  SubscriptionStatus 
} from '@/lib/subscription';

interface SubscriptionStore {
  // State
  subscription: SubscriptionStatus;
  isLoading: boolean;
  
  // Actions
  checkSubscription: (userId: string) => Promise<void>;
  upgradeToPremiun: (userId: string, email: string, name: string, planId: string) => Promise<{ success: boolean; error?: string }>;
  cancelSubscription: (userId: string) => Promise<{ success: boolean; error?: string }>;
  syncSubscription: (userId: string) => Promise<void>;
  setSubscription: (subscription: SubscriptionStatus) => void;
  reset: () => void;
}

const defaultSubscription: SubscriptionStatus = {
  isActive: false,
  plan: 'free',
  status: 'free'
};

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      subscription: defaultSubscription,
      isLoading: false,

      // Check subscription status
      checkSubscription: async (userId: string) => {
        set({ isLoading: true });
        try {
          const subscription = await checkPremiumStatus(userId);
          set({ subscription, isLoading: false });
        } catch (error) {
          console.error('Error checking subscription:', error);
          set({ subscription: defaultSubscription, isLoading: false });
        }
      },

      // Upgrade to premium
      upgradeToPremiun: async (userId: string, email: string, name: string, planId: string) => {
        set({ isLoading: true });
        try {
          const result = await createPremiumSubscription(userId, email, name, planId);
          
          if (result.success) {
            // Refresh subscription status
            await get().checkSubscription(userId);
          }
          
          set({ isLoading: false });
          return result;
        } catch (error) {
          console.error('Error upgrading to premium:', error);
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upgrade'
          };
        }
      },

      // Cancel subscription
      cancelSubscription: async (userId: string) => {
        set({ isLoading: true });
        try {
          const result = await cancelPremiumSubscription(userId);
          
          if (result.success) {
            // Refresh subscription status
            await get().checkSubscription(userId);
          }
          
          set({ isLoading: false });
          return result;
        } catch (error) {
          console.error('Error canceling subscription:', error);
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cancel subscription'
          };
        }
      },

      // Sync subscription with Stripe
      syncSubscription: async (userId: string) => {
        try {
          await syncSubscriptionStatus(userId);
          await get().checkSubscription(userId);
        } catch (error) {
          console.error('Error syncing subscription:', error);
        }
      },

      // Set subscription
      setSubscription: (subscription: SubscriptionStatus) => {
        set({ subscription });
      },

      // Reset store
      reset: () => {
        set({
          subscription: defaultSubscription,
          isLoading: false
        });
      },
    }),
    {
      name: 'subscription-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
      }),
    }
  )
);

// Selectors
export const useSubscription = () => useSubscriptionStore((state) => state.subscription);
export const useIsSubscriptionLoading = () => useSubscriptionStore((state) => state.isLoading);
export const useIsPremium = () => useSubscriptionStore((state) => state.subscription.isActive);