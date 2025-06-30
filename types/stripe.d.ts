declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
      STRIPE_SECRET_KEY: string;
    }
  }
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
}

export interface StripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing';
  current_period_end: number;
  customer: string;
}

export interface StripePriceData {
  id: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'month' | 'year';
  };
}

export {};