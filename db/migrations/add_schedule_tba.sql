-- Add schedule TBA flag for markets with unpublished dates/times
ALTER TABLE market_details
ADD COLUMN IF NOT EXISTS is_schedule_tba BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN market_details.is_schedule_tba IS 'True when Date & Time is not yet announced';
