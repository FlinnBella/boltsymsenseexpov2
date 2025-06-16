/*
  # Add biometric data and Terra integration tables

  1. New Tables
    - `user_biometric_data` - Store daily biometric readings from wearables
    - `terra_connections` - Track user connections to Terra providers
    - `health_goals` - Store user's customizable health goals
    - `symptom_logs` - Track user-reported symptoms
    - `medication_logs` - Track medication intake

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add performance indexes for common queries
*/

-- Biometric data table for storing daily health metrics
CREATE TABLE IF NOT EXISTS user_biometric_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  steps integer DEFAULT 0,
  calories_burned integer DEFAULT 0,
  distance_meters numeric(10,2) DEFAULT 0,
  active_minutes integer DEFAULT 0,
  heart_rate_avg integer,
  heart_rate_min integer,
  heart_rate_max integer,
  heart_rate_resting integer,
  sleep_hours numeric(4,2),
  sleep_quality_score integer,
  weight_kg numeric(5,2),
  body_fat_percentage numeric(4,2),
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  blood_oxygen_percentage numeric(4,2),
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  hydration_ml integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Terra connections table to track wearable integrations
CREATE TABLE IF NOT EXISTS terra_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  terra_user_id text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('APPLE', 'GOOGLE', 'FITBIT', 'GARMIN', 'SAMSUNG', 'OURA', 'POLAR', 'SUUNTO', 'WAHOO')),
  reference_id text NOT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Health goals table for customizable targets
CREATE TABLE IF NOT EXISTS health_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('steps', 'calories', 'active_minutes', 'sleep_hours', 'weight', 'hydration')),
  target_value numeric(10,2) NOT NULL,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, goal_type)
);

-- Symptom logs for user-reported health data
CREATE TABLE IF NOT EXISTS symptom_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptom_name text NOT NULL,
  severity integer NOT NULL CHECK (severity >= 1 AND severity <= 10),
  description text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Medication logs for tracking intake
CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  taken_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_biometric_data_user_date ON user_biometric_data(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_terra_connections_user ON terra_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_health_goals_user ON health_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON symptom_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_date ON medication_logs(user_id, taken_at DESC);

-- Enable RLS
ALTER TABLE user_biometric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE terra_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_biometric_data
CREATE POLICY "Users can manage their own biometric data"
  ON user_biometric_data
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for terra_connections
CREATE POLICY "Users can manage their own Terra connections"
  ON terra_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for health_goals
CREATE POLICY "Users can manage their own health goals"
  ON health_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for symptom_logs
CREATE POLICY "Users can manage their own symptom logs"
  ON symptom_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for medication_logs
CREATE POLICY "Users can manage their own medication logs"
  ON medication_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_biometric_data_updated_at
    BEFORE UPDATE ON user_biometric_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_terra_connections_updated_at
    BEFORE UPDATE ON terra_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_goals_updated_at
    BEFORE UPDATE ON health_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();