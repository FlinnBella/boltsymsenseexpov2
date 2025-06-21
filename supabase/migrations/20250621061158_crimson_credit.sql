/*
  # Update signup workflow schema

  1. Database Changes
    - Add medical conditions support to patients table
    - Ensure proper address fields in users table
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with constraints
*/

-- Ensure patients table has chronic_conditions field (may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'chronic_conditions'
  ) THEN
    ALTER TABLE patients ADD COLUMN chronic_conditions text;
  END IF;
END $$;

-- Ensure users table has all required address fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'address_line_1'
  ) THEN
    ALTER TABLE users ADD COLUMN address_line_1 character varying(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'city'
  ) THEN
    ALTER TABLE users ADD COLUMN city character varying(100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'state'
  ) THEN
    ALTER TABLE users ADD COLUMN state character varying(50);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE users ADD COLUMN zip_code character varying(10);
  END IF;
END $$;

-- Add indexes for better performance on address lookups
CREATE INDEX IF NOT EXISTS idx_users_zip_code ON users(zip_code);
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
CREATE INDEX IF NOT EXISTS idx_patients_chronic_conditions ON patients USING gin(to_tsvector('english', chronic_conditions));

-- Add comments for documentation
COMMENT ON COLUMN patients.chronic_conditions IS 'Comma-separated list of chronic medical conditions';
COMMENT ON COLUMN users.address_line_1 IS 'Primary street address';
COMMENT ON COLUMN users.city IS 'City name (auto-populated from ZIP code)';
COMMENT ON COLUMN users.state IS 'State abbreviation (auto-populated from ZIP code)';
COMMENT ON COLUMN users.zip_code IS 'US ZIP code for address validation';