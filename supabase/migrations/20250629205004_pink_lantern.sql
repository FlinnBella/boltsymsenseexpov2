/*
  # Add Premium Subscription Support

  1. New Columns to users table
    - `stripe_customer_id` - Stripe customer ID for payment processing
    - `subscription_status` - Current subscription status
    - `subscription_id` - Stripe subscription ID
    - `subscription_plan` - Current plan (free, premium_monthly, premium_yearly)
    - `subscription_expires_at` - When subscription expires
    - `subscription_created_at` - When subscription was created

  2. Indexes
    - Add indexes for subscription lookups
    - Add index for customer ID lookups

  3. Default Values
    - Set default subscription status to 'free'
    - Set default plan to 'free'
*/

-- Add subscription columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_created_at timestamptz DEFAULT NULL;

-- Add constraints for subscription status
ALTER TABLE users 
ADD CONSTRAINT users_subscription_status_check 
CHECK (subscription_status IN ('free', 'active', 'canceled', 'past_due', 'trialing', 'incomplete'));

-- Add constraints for subscription plan
ALTER TABLE users 
ADD CONSTRAINT users_subscription_plan_check 
CHECK (subscription_plan IN ('free', 'premium_monthly', 'premium_yearly'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires ON users(subscription_expires_at);

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status (free, active, canceled, past_due, trialing, incomplete)';
COMMENT ON COLUMN users.subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN users.subscription_plan IS 'Current subscription plan (free, premium_monthly, premium_yearly)';
COMMENT ON COLUMN users.subscription_expires_at IS 'When the current subscription expires';
COMMENT ON COLUMN users.subscription_created_at IS 'When the subscription was first created';