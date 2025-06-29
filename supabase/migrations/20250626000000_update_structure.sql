/*
  # Health Data Cache and Food Logs Cache Update

  1. New Tables
    - `health_data_cache` - For storing user health metrics with history

  2. Table Modifications
    - Rename `food_logs` to `food_logs_cache` to match expected naming

  3. Security
    - Enable RLS on new table
    - Add policies for users to manage their own data

  4. Indexes
    - Add performance indexes for common queries
*/

-- Create health_data_cache table
CREATE TABLE IF NOT EXISTS health_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  steps integer NOT NULL DEFAULT 0,
  heart_rate_avg integer DEFAULT NULL,
  calories integer NOT NULL DEFAULT 0,
  sleep float DEFAULT NULL,
  distance float NOT NULL DEFAULT 0,
  active_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Rename food_logs to food_logs_cache
ALTER TABLE food_logs
RENAME TO food_logs_cache;

-- Enable RLS on health_data_cache
ALTER TABLE health_data_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for health_data_cache
CREATE POLICY "Users can manage their own health data cache"
  ON health_data_cache
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_data_cache_user_date ON health_data_cache(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_data_cache_user_latest ON health_data_cache(user_id, created_at DESC) WHERE created_at >= CURRENT_DATE;

-- Add comments for documentation
COMMENT ON TABLE health_data_cache IS 'Stores historical health data metrics for users';
COMMENT ON COLUMN health_data_cache.steps IS 'Daily steps count';
COMMENT ON COLUMN health_data_cache.heart_rate_avg IS 'Average heart rate (BPM)';
COMMENT ON COLUMN health_data_cache.calories IS 'Calories burned';
COMMENT ON COLUMN health_data_cache.sleep IS 'Sleep duration in hours';
COMMENT ON COLUMN health_data_cache.distance IS 'Distance traveled in kilometers';
COMMENT ON COLUMN health_data_cache.active_minutes IS 'Active minutes for the day';
COMMENT ON COLUMN health_data_cache.created_at IS 'Timestamp when the health data was recorded';
