-- Add is_trending column to sales_opportunities
-- enabling manual curation of "Upcoming/Trending" markets

ALTER TABLE sales_opportunities 
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;

-- Optional: Create an index if we plan to query this often on the landing page
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_trending ON sales_opportunities(is_trending) WHERE is_trending = TRUE;
