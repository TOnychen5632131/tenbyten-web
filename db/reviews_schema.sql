-- 1. Add Google Place ID to the main table
-- This allows us to link our internal ID to Google's ID permanently once found
ALTER TABLE sales_opportunities 
ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- 2. Create Reviews Table
-- This table acts as a cache for Google Reviews to save API costs and improve speed
CREATE TABLE IF NOT EXISTS opportunity_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES sales_opportunities(id) ON DELETE CASCADE,
    
    author_name TEXT,
    author_photo_url TEXT,
    rating INTEGER, -- 1-5 stars
    text TEXT,
    original_date TEXT, -- Currently storing as text string from Google (e.g., "a month ago") or timestamp
    source_url TEXT,
    
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure we don't duplicate the exact same review content for the same place
    UNIQUE(opportunity_id, author_name, text)
);

-- Index for fast lookup by opportunity
CREATE INDEX IF NOT EXISTS idx_reviews_opportunity_id ON opportunity_reviews(opportunity_id);
