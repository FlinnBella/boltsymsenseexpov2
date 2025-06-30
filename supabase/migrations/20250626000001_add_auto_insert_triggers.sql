/*
  # Auto-Insert Triggers for User Dependencies
  
  1. Functions
    - `create_default_user_preferences()` - Creates default preferences for new users
    - `create_default_patient_record()` - Creates default patient record for new users
  
  2. Triggers
    - Automatically create user_preferences when user is inserted
    - Automatically create patient record when user is inserted
  
  3. Benefits
    - Ensures every user has required related records
    - Prevents foreign key constraint errors
    - Maintains data consistency
*/

-- Function to create default user preferences
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default user preferences for the new user
  INSERT INTO user_preferences (
    user_id,
    wearable_connected,
    wearable_prompt_dismissed,
    notification_preferences,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    false,
    false,
    '{"achievements": true, "healthAlerts": true, "medications": true, "appointments": true}'::jsonb,
    now(),
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Function to create default patient record
CREATE OR REPLACE FUNCTION create_default_patient_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default patient record for the new user
  INSERT INTO patients (
    user_id,
    medical_record_number,
    ethnicity,
    race,
    preferred_language,
    marital_status,
    occupation,
    emergency_contact_name,
    emergency_contact_relationship,
    emergency_contact_phone,
    emergency_contact_email,
    insurance_provider,
    insurance_policy_number,
    insurance_group_number,
    insurance_subscriber_id,
    blood_type,
    allergies,
    chronic_conditions,
    current_medications,
    family_medical_history,
    height_inches,
    weight_pounds,
    preferred_provider_gender,
    communication_preferences,
    appointment_reminder_preferences
  ) VALUES (
    NEW.id,
    NULL,  -- Will be set later when needed
    NULL,
    NULL,
    'English',  -- Default language
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{"email": true, "sms": false, "push": true}'::jsonb,  -- Default communication preferences
    '{"email": true, "sms": false, "push": true, "hours_before": 24}'::jsonb  -- Default reminder preferences
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Trigger to create user preferences after user insertion
CREATE TRIGGER trigger_create_user_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_preferences();

-- Trigger to create patient record after user insertion
CREATE TRIGGER trigger_create_patient_record
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_patient_record();

-- Add comments for documentation
COMMENT ON FUNCTION create_default_user_preferences() IS 'Automatically creates default user preferences when a new user is created';
COMMENT ON FUNCTION create_default_patient_record() IS 'Automatically creates default patient record when a new user is created';
COMMENT ON TRIGGER trigger_create_user_preferences ON users IS 'Ensures every new user gets default preferences';
COMMENT ON TRIGGER trigger_create_patient_record ON users IS 'Ensures every new user gets a patient record';

-- Backfill existing users who don't have preferences or patient records
-- This handles any existing users that were created before these triggers

-- Backfill user_preferences for existing users
INSERT INTO user_preferences (
  user_id,
  wearable_connected,
  wearable_prompt_dismissed,
  notification_preferences,
  created_at,
  updated_at
)
SELECT 
  u.id,
  false,
  false,
  '{"achievements": true, "healthAlerts": true, "medications": true, "appointments": true}'::jsonb,
  now(),
  now()
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- Backfill patient records for existing users
INSERT INTO patients (
  user_id,
  preferred_language,
  communication_preferences,
  appointment_reminder_preferences
)
SELECT 
  u.id,
  'English',
  '{"email": true, "sms": false, "push": true}'::jsonb,
  '{"email": true, "sms": false, "push": true, "hours_before": 24}'::jsonb
FROM users u
LEFT JOIN patients p ON u.id = p.user_id
WHERE p.user_id IS NULL;
