-- Add admission_fees column to market_details
ALTER TABLE market_details ADD COLUMN IF NOT EXISTS admission_fees JSONB DEFAULT '[]'::JSONB;

-- Optional: Migrate existing data (simple approach)
-- UPDATE market_details 
-- SET admission_fees = jsonb_build_array(jsonb_build_object('label', 'General Admission', 'price', admission_fee))
-- WHERE admission_fee IS NOT NULL AND admission_fee != '' AND (admission_fees IS NULL OR jsonb_array_length(admission_fees) = 0);
