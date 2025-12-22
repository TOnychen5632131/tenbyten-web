-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Users Table (Basic)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Base Sales Opportunities Table
-- This table holds the common data for both Markets and Consignment shops.
-- It is designed to be searchable via vector embeddings (logic to be implemented in application layer or via pgvector).
CREATE TABLE IF NOT EXISTS sales_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Optional: link to creator
    type TEXT NOT NULL CHECK (type IN ('MARKET', 'CONSIGNMENT')),
    
    -- Searchable/Display Fields
    title TEXT NOT NULL,
    description TEXT, -- Rich text description
    
    -- Location Data
    address TEXT, 
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Media & Metadata
    images TEXT[], -- Array of image URLs
    tags TEXT[],   -- Array of search tags
    
    -- System Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster filtering by type and creation date
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_type ON sales_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_created_at ON sales_opportunities(created_at);

-- 3. Create Market Details Table
-- Specific attributes for temporary/recurring events like Farmers Markets.
CREATE TABLE IF NOT EXISTS market_details (
    opportunity_id UUID PRIMARY KEY REFERENCES sales_opportunities(id) ON DELETE CASCADE,
    
    start_date DATE, -- The specific calendar day (e.g. 2024-03-05)
    end_date DATE,   -- Useful for multi-day festivals
    
    start_time TIME, -- "When does it open?" (e.g. 09:00)
    end_time TIME,   -- "When does it close?" (e.g. 14:00)
    
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern TEXT, -- e.g., "Every Sunday", "First Saturday of Month"
    
    organizer_name TEXT,
    organizer_contact TEXT,
    
    admission_fee DECIMAL(10, 2) DEFAULT 0,
    parking_info TEXT,
    vendor_count INTEGER,
    
    -- Logistics & Environment
    is_indoors BOOLEAN, -- "Do I need a tent?"
    electricity_access BOOLEAN, -- "Can I plug in my lights?"
    booth_size TEXT, -- "10x10" or "Tabletop"
    application_deadline DATE, -- "When do I need to apply by?"

    categories TEXT[], -- e.g., ["Produce", "Antiques", "Art"]
    weather_policy TEXT, -- e.g., "Rain or Shine"
    application_link TEXT
);

-- 4. Create Consignment Details Table
-- Specific attributes for permanent physical shops.
CREATE TABLE IF NOT EXISTS consignment_details (
    opportunity_id UUID PRIMARY KEY REFERENCES sales_opportunities(id) ON DELETE CASCADE,
    
    -- Business Information
    business_hours JSONB, -- Detailed open/close times
    open_days INTEGER[], -- [0,1,2,3,4,5,6] (0=Sunday) for fast SQL filtering of "Which shops are open on March 5th?"
    
    website TEXT,
    phone TEXT,
    social_media_links JSONB, -- { "instagram": "...", "facebook": "..." }
    
    -- Consignment Specifics
    accepted_items TEXT[], -- Important for search filtering
    excluded_brands TEXT[], -- "No SHEIN/Zara"
    item_preparation TEXT, -- "Must be on hangers"
    authentication_fee DECIMAL(10, 2), -- "Upfront cost?"
    
    consignment_split TEXT, -- e.g., "50/50"
    payout_method TEXT, -- e.g., "Cash", "Store Credit"
    contract_duration_days INTEGER, -- "How long they keep items"
    
    appointment_required BOOLEAN DEFAULT FALSE,
    intake_hours TEXT, -- "When can you consign?" (e.g., "Tuesdays 10-12 only")
    drop_off_policy TEXT
);

-- 5. Create Search Function (Optional: Foundation for AI Search)
-- This function concatenates relevant text fields for generating embeddings.
CREATE OR REPLACE FUNCTION get_searchable_text(opportunity_id UUID)
RETURNS TEXT AS $$
DECLARE
    opp sales_opportunities;
    mkt market_details;
    con consignment_details;
    result TEXT;
BEGIN
    SELECT * INTO opp FROM sales_opportunities WHERE id = opportunity_id;
    
    result := opp.title || ' ' || COALESCE(opp.description, '') || ' ' || array_to_string(opp.tags, ' ');
    
    IF opp.type = 'MARKET' THEN
        SELECT * INTO mkt FROM market_details WHERE opportunity_id = opp.id;
        result := result || ' ' || array_to_string(mkt.categories, ' ') || ' ' || COALESCE(mkt.parking_info, '');
    ELSIF opp.type = 'CONSIGNMENT' THEN
        SELECT * INTO con FROM consignment_details WHERE opportunity_id = opp.id;
        result := result || ' ' || array_to_string(con.accepted_items, ' ') || ' ' || COALESCE(con.drop_off_policy, '');
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
