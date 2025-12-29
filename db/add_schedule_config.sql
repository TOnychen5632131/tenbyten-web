-- Add additional columns for complex schedules and application periods

-- 1. Complex Schedule (JSONB)
ALTER TABLE market_details 
ADD COLUMN IF NOT EXISTS additional_schedules JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN market_details.additional_schedules IS 'Stores complex schedule segments (seasonal hours, multi-day exceptions)';

-- 2. Application Period (Start/End Dates)
ALTER TABLE market_details 
ADD COLUMN IF NOT EXISTS application_start_date DATE DEFAULT NULL;

ALTER TABLE market_details 
ADD COLUMN IF NOT EXISTS application_end_date DATE DEFAULT NULL;

COMMENT ON COLUMN market_details.application_start_date IS 'Start date of the vendor application window';
COMMENT ON COLUMN market_details.application_end_date IS 'End date of the vendor application window';
