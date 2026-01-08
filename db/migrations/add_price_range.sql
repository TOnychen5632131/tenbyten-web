-- Add price_range column to vendor_profiles
ALTER TABLE vendor_profiles 
ADD COLUMN IF NOT EXISTS preferred_price_range text;

-- Add check constraint to ensure valid values (optional but good for data integrity)
-- Valid values: 'Under $50', '$50 - $100', '$100 - $200', '$200+', 'Any'
