/*
  # Add user preferences columns to users table

  1. New Columns
    - `dashboard_layout` - JSON array for dashboard widget order
    - `health_goal_steps` - Daily steps target
    - `health_goal_calories` - Daily calories target  
    - `health_goal_active_minutes` - Daily active minutes target
    - `health_goal_sleep_hours` - Daily sleep hours target
    - `notification_achievements` - Achievement notifications preference
    - `notification_health_alerts` - Health alerts preference
    - `notification_medications` - Medication reminders preference
    - `notification_appointments` - Appointment reminders preference

  2. Default Values
    - Set sensible defaults matching the app's defaultPreferences
*/

-- Add user preferences columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS dashboard_layout jsonb DEFAULT '["steps", "heartRate", "calories", "sleep"]'::jsonb,
ADD COLUMN IF NOT EXISTS health_goal_steps integer DEFAULT 10000,
ADD COLUMN IF NOT EXISTS health_goal_calories integer DEFAULT 2000,
ADD COLUMN IF NOT EXISTS health_goal_active_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS health_goal_sleep_hours numeric(4,2) DEFAULT 8.0,
ADD COLUMN IF NOT EXISTS notification_achievements boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_health_alerts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_medications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_appointments boolean DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN users.dashboard_layout IS 'JSON array defining the order of dashboard widgets';
COMMENT ON COLUMN users.health_goal_steps IS 'Daily steps target';
COMMENT ON COLUMN users.health_goal_calories IS 'Daily calories burned target';
COMMENT ON COLUMN users.health_goal_active_minutes IS 'Daily active minutes target';
COMMENT ON COLUMN users.health_goal_sleep_hours IS 'Daily sleep hours target';
COMMENT ON COLUMN users.notification_achievements IS 'Enable achievement notifications';
COMMENT ON COLUMN users.notification_health_alerts IS 'Enable health alert notifications';
COMMENT ON COLUMN users.notification_medications IS 'Enable medication reminder notifications';
COMMENT ON COLUMN users.notification_appointments IS 'Enable appointment reminder notifications'; 