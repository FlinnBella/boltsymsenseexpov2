import { supabase } from './supabase';
import { createStripeCustomer, createSubscription, getCustomerSubscriptions } from './stripe';

export interface SubscriptionStatus {
  isActive: boolean;
  plan: 'free' | 'premium_monthly' | 'premium_yearly';
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  expiresAt?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
}

// Check if user has active premium subscription
export async function checkPremiumStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_status, subscription_plan, subscription_expires_at, stripe_customer_id, subscription_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking premium status:', error);
      return {
        isActive: false,
        plan: 'free',
        status: 'free'
      };
    }

    const now = new Date();
    const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    
    // Check if subscription is active and not expired
    const isActive = user.subscription_status === 'active' && 
                    user.subscription_plan !== 'free' &&
                    (!expiresAt || expiresAt > now);

    return {
      isActive,
      plan: user.subscription_plan || 'free',
      status: user.subscription_status || 'free',
      expiresAt: user.subscription_expires_at,
      stripeCustomerId: user.stripe_customer_id,
      subscriptionId: user.subscription_id
    };
  } catch (error) {
    console.error('Error checking premium status:', error);
    return {
      isActive: false,
      plan: 'free',
      status: 'free'
    };
  }
}

// Update user subscription in database
export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    status: string;
    plan: string;
    expiresAt?: string;
  }
): Promise<void> {
  try {
    const updateData: any = {
      subscription_status: subscriptionData.status,
      subscription_plan: subscriptionData.plan,
      updated_at: new Date().toISOString()
    };

    if (subscriptionData.stripeCustomerId) {
      updateData.stripe_customer_id = subscriptionData.stripeCustomerId;
    }

    if (subscriptionData.subscriptionId) {
      updateData.subscription_id = subscriptionData.subscriptionId;
    }

    if (subscriptionData.expiresAt) {
      updateData.subscription_expires_at = subscriptionData.expiresAt;
    }

    // Set subscription_created_at if this is the first time subscribing
    if (subscriptionData.status === 'active' && subscriptionData.plan !== 'free') {
      const { data: currentUser } = await supabase
        .from('users')
        .select('subscription_created_at')
        .eq('id', userId)
        .single();

      if (!currentUser?.subscription_created_at) {
        updateData.subscription_created_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

// Create premium subscription workflow
export async function createPremiumSubscription(
  userId: string,
  email: string,
  name: string,
  planId: string
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    // Check if user already has a Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = user?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await createStripeCustomer(email, name);
      customerId = customer.id;
    }

    // Get the correct Stripe price ID based on plan
    const stripePriceId = planId === 'premium_yearly' ? 'price_premium_yearly' : 'price_premium_monthly';

    // Create subscription
    const subscription = await createSubscription(customerId, stripePriceId);

    // Calculate expiration date
    const expiresAt = new Date();
    if (planId === 'premium_yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Update user subscription in database
    await updateUserSubscription(userId, {
      stripeCustomerId: customerId,
      subscriptionId: subscription.id,
      status: 'active',
      plan: planId,
      expiresAt: expiresAt.toISOString()
    });

    return {
      success: true,
      subscriptionId: subscription.id
    };
  } catch (error) {
    console.error('Error creating premium subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    };
  }
}

// Cancel premium subscription
export async function cancelPremiumSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('subscription_id')
      .eq('id', userId)
      .single();

    if (!user?.subscription_id) {
      throw new Error('No active subscription found');
    }

    // Cancel subscription in Stripe (this would be a real Stripe API call)
    // await cancelSubscription(user.subscription_id);

    // Update user subscription status
    await updateUserSubscription(userId, {
      status: 'canceled',
      plan: 'free'
    });

    return { success: true };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    };
  }
}

// Sync subscription status with Stripe
export async function syncSubscriptionStatus(userId: string): Promise<void> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!user?.stripe_customer_id) {
      return;
    }

    // Get subscriptions from Stripe
    const subscriptions = await getCustomerSubscriptions(user.stripe_customer_id);
    
    if (subscriptions.data && subscriptions.data.length > 0) {
      const activeSubscription = subscriptions.data.find((sub: any) => 
        sub.status === 'active' || sub.status === 'trialing'
      );

      if (activeSubscription) {
        const expiresAt = new Date(activeSubscription.current_period_end * 1000);
        const plan = activeSubscription.items.data[0]?.price?.recurring?.interval === 'year' 
          ? 'premium_yearly' 
          : 'premium_monthly';

        await updateUserSubscription(userId, {
          subscriptionId: activeSubscription.id,
          status: activeSubscription.status,
          plan,
          expiresAt: expiresAt.toISOString()
        });
      } else {
        // No active subscription, set to free
        await updateUserSubscription(userId, {
          status: 'free',
          plan: 'free'
        });
      }
    }
  } catch (error) {
    console.error('Error syncing subscription status:', error);
  }
}