/*
  # Health Tracking Tables Migration

  1. New Tables
    - `symptom_logs` - For tracking user symptoms
    - `medication_logs` - For tracking medication intake
    - `food_logs` - For tracking food consumption and effects
    - `user_preferences` - For storing user preferences including wearable connection status

  2. Security
    - Enable RLS on all new tables
    - Add policies for users to manage their own data

  3. Indexes
    - Add performance indexes for common queries
*/

-- Create symptom_logs table
CREATE TABLE IF NOT EXISTS symptom_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptom_name text NOT NULL,
  severity integer NOT NULL CHECK (severity >= 1 AND severity <= 10),
  description text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create medication_logs table
CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  taken_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create food_logs table
CREATE TABLE IF NOT EXISTS food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  negative_effects text,
  consumed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  wearable_connected boolean DEFAULT false,
  wearable_prompt_dismissed boolean DEFAULT false,
  notification_preferences jsonb DEFAULT '{"achievements": true, "healthAlerts": true, "medications": true, "appointments": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for symptom_logs
CREATE POLICY "Users can manage their own symptom logs"
  ON symptom_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for medication_logs
CREATE POLICY "Users can manage their own medication logs"
  ON medication_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for food_logs
CREATE POLICY "Users can manage their own food logs"
  ON food_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_preferences
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON symptom_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_date ON medication_logs(user_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Create update trigger for user_preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();