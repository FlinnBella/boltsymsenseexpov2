/*
  # Add health data cache columns to users table

  1. New Columns (Current/Latest Health Data Cache)
    - `current_steps` - Latest daily steps count
    - `current_heart_rate` - Latest heart rate reading
    - `current_calories` - Latest calories burned
    - `current_sleep_hours` - Latest sleep duration
    - `current_active_minutes` - Latest active minutes
    - `current_distance_meters` - Latest distance traveled
    - `current_weight_kg` - Latest weight measurement
    - `current_blood_pressure_systolic` - Latest systolic BP
    - `current_blood_pressure_diastolic` - Latest diastolic BP
    - `health_data_last_updated` - Timestamp of last health data sync

  2. Default Values
    - Set default values to 0 or null where appropriate
*/

-- Add health data cache columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_steps integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_heart_rate integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_calories integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_sleep_hours numeric(4,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_active_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_distance_meters numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_weight_kg numeric(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_blood_pressure_systolic integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_blood_pressure_diastolic integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS health_data_last_updated timestamptz DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.current_steps IS 'Latest daily steps count from connected devices';
COMMENT ON COLUMN users.current_heart_rate IS 'Latest heart rate reading (BPM)';
COMMENT ON COLUMN users.current_calories IS 'Latest calories burned today';
COMMENT ON COLUMN users.current_sleep_hours IS 'Latest sleep duration (hours)';
COMMENT ON COLUMN users.current_active_minutes IS 'Latest active minutes today';
COMMENT ON COLUMN users.current_distance_meters IS 'Latest distance traveled (meters)';
COMMENT ON COLUMN users.current_weight_kg IS 'Latest weight measurement (kg)';
COMMENT ON COLUMN users.current_blood_pressure_systolic IS 'Latest systolic blood pressure';
COMMENT ON COLUMN users.current_blood_pressure_diastolic IS 'Latest diastolic blood pressure';
COMMENT ON COLUMN users.health_data_last_updated IS 'Timestamp of last health data sync'; 