-- Add calories and portion_size columns to food_logs_cache table
ALTER TABLE food_logs_cache 
ADD COLUMN IF NOT EXISTS calories integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS portion_size text DEFAULT '1';

-- Add comments for documentation
COMMENT ON COLUMN food_logs_cache.calories IS 'Total calories for the logged food portion';
COMMENT ON COLUMN food_logs_cache.portion_size IS 'Portion size description (e.g., "1 cup", "2 servings")';

-- Update existing records to have default values
UPDATE food_logs_cache 
SET calories = 0, portion_size = '1' 
WHERE calories IS NULL OR portion_size IS NULL;