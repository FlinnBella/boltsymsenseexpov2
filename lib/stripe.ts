import { Platform } from 'react-native';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 29.99,
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    features: [
      'Unlimited AI consultations',
      'Extended video calls with doctors',
      'Priority appointment booking',
      'Advanced health analytics',
      'Personalized health insights',
      '24/7 premium support'
    ]
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 299.99,
    currency: 'usd',
    interval: 'year',
    stripePriceId: 'price_premium_yearly', // Replace with actual Stripe price ID
    features: [
      'Unlimited AI consultations',
      'Extended video calls with doctors',
      'Priority appointment booking',
      'Advanced health analytics',
      'Personalized health insights',
      '24/7 premium support',
      '2 months free (save 17%)'
    ]
  }
];

// Create Stripe customer
export async function createStripeCustomer(email: string, name?: string) {
  try {
    const response = await fetch('/api/stripe/create-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      throw new Error('Failed to create customer');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Create subscription
export async function createSubscription(customerId: string, priceId: string) {
  try {
    const response = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId, priceId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Get customer subscriptions
export async function getCustomerSubscriptions(customerId: string) {
  try {
    const response = await fetch(`/api/stripe/subscriptions?customerId=${customerId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Format price for display
export function formatPrice(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

// Check if user has active premium subscription
export function hasActivePremium(subscriptions: any[]): boolean {
  return subscriptions.some(sub => 
    sub.status === 'active' || sub.status === 'trialing'
  );
}