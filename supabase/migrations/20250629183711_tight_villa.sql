/*
  # Add OAuth support to users table

  1. New Columns
    - `provider` - OAuth provider (email, google, facebook)
    - `provider_id` - Provider-specific user ID
    - `email_verified` - Email verification status
    - `email_verified_at` - Email verification timestamp

  2. Indexes
    - Add indexes for OAuth lookups
    - Add unique constraint for provider + provider_id

  3. Security
    - Maintain existing RLS policies
*/

-- Add OAuth support columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS provider_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at timestamptz DEFAULT NULL;

-- Create unique index for OAuth providers
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_id 
ON users(provider, provider_id) 
WHERE provider_id IS NOT NULL;

-- Add index for email verification lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Add comments for documentation
COMMENT ON COLUMN users.provider IS 'Authentication provider: email, google, facebook';
COMMENT ON COLUMN users.provider_id IS 'Provider-specific user ID for OAuth users';
COMMENT ON COLUMN users.email_verified IS 'Whether the user email has been verified';
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp when email was verified';