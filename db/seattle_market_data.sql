-- Database Population Script for Seattle/WA Market & Consignment Data
-- Run this script to populate the database with real-world examples.

DO $$
DECLARE
    v_user_id UUID;
    v_opp_id UUID;
BEGIN
    ---------------------------------------------------------------------------
    -- 1. Setup Demo User
    ---------------------------------------------------------------------------
    -- Insert a demo user to own these records if not exists
    INSERT INTO users (email, name) 
    VALUES ('seattle_demo@tenbyten.com', 'Seattle City Guide')
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_user_id;

    RAISE NOTICE 'Using User ID: %', v_user_id;

    ---------------------------------------------------------------------------
    -- 2. MARKETS
    ---------------------------------------------------------------------------

    -- A. Pike Place Market
    INSERT INTO sales_opportunities (
        user_id, type, title, description, 
        address, latitude, longitude, 
        images, tags
    ) VALUES (
        v_user_id, 'MARKET', 'Pike Place Market', 
        'One of the oldest continuously operated public farmers'' markets in the US. A vibrant neighborhood comprising hundreds of farmers, craftspeople, small businesses, and residents.',
        '85 Pike St, Seattle, WA 98101', 47.6097, -122.3422,
        ARRAY['https://images.unsplash.com/photo-1540306233-ca48259b9a69', 'https://images.unsplash.com/photo-1628198902506-69d652932943'],
        ARRAY['tourist', 'historic', 'food', 'crafts', 'daily']
    ) RETURNING id INTO v_opp_id;

    INSERT INTO market_details (
        opportunity_id, start_time, end_time, is_recurring, recurring_pattern,
        organizer_name, admission_fee, is_indoors, electricity_access, booth_size,
        categories, weather_policy, application_link
    ) VALUES (
        v_opp_id, '09:00', '18:00', TRUE, 'Daily',
        'Pike Place Market PDA', 0.00, TRUE, TRUE, 'Various',
        ARRAY['Produce', 'Crafts', 'Food'], 'Indoors/Covered', 'http://pikeplacemarket.org'
    );

    -- B. Fremont Sunday Market
    INSERT INTO sales_opportunities (
        user_id, type, title, description, 
        address, latitude, longitude, 
        images, tags
    ) VALUES (
        v_user_id, 'MARKET', 'Fremont Sunday Market', 
        'Long-standing European-style street market featuring 200+ vendors offering antiques, collectibles, vintage clothing, furniture, and world food.',
        '3401 Evanston Ave N, Seattle, WA 98103', 47.6517, -122.3539,
        ARRAY['https://images.unsplash.com/photo-1533038590840-1cde6e668a91'],
        ARRAY['vintage', 'antiques', 'street food', 'sunday', 'fremont']
    ) RETURNING id INTO v_opp_id;

    INSERT INTO market_details (
        opportunity_id, start_time, end_time, is_recurring, recurring_pattern,
        organizer_name, admission_fee, is_indoors, electricity_access, booth_size,
        categories, weather_policy, application_link
    ) VALUES (
        v_opp_id, '10:00', '16:00', TRUE, 'Every Sunday',
        'Fremont Market', 0.00, FALSE, FALSE, '10x10',
        ARRAY['Antiques', 'Vintage', 'Food Trucks'], 'Rain or Shine', 'http://www.fremontmarket.com'
    );

    -- C. Ballard Farmers Market
    INSERT INTO sales_opportunities (
        user_id, type, title, description, 
        address, latitude, longitude, 
        images, tags
    ) VALUES (
        v_user_id, 'MARKET', 'Ballard Farmers Market', 
        'Seattle''s first year-round neighborhood farmers market selling exclusively Washington state grown and produced products.',
        '5300 Ballard Ave NW, Seattle, WA 98107', 47.6675, -122.3846,
        ARRAY['https://images.unsplash.com/photo-1488459716781-31db52582fe9'],
        ARRAY['organic', 'produce', 'local', 'sunday', 'ballard']
    ) RETURNING id INTO v_opp_id;

    INSERT INTO market_details (
        opportunity_id, start_time, end_time, is_recurring, recurring_pattern,
        organizer_name, admission_fee, is_indoors, electricity_access, booth_size,
        categories, weather_policy, application_link
    ) VALUES (
        v_opp_id, '10:00', '15:00', TRUE, 'Every Sunday',
        'Seattle Farmers Market Association', 0.00, FALSE, FALSE, '10x10',
        ARRAY['Produce', 'Baked Goods', 'Plants'], 'Rain or Shine', 'https://www.sfmamarkets.com'
    );

    -- D. University District Farmers Market
    INSERT INTO sales_opportunities (
        user_id, type, title, description, 
        address, latitude, longitude, 
        images, tags
    ) VALUES (
        v_user_id, 'MARKET', 'University District Farmers Market', 
        'A world-class farmers market committed to local, sustainable agriculture. A favorite of local chefs.',
        'University Way NE & NE 50th St, Seattle, WA 98105', 47.6659, -122.3134,
        ARRAY['https://images.unsplash.com/photo-1542838132-92c53300491e'],
        ARRAY['farmers market', 'udistrict', 'organic', 'saturday']
    ) RETURNING id INTO v_opp_id;

    INSERT INTO market_details (
        opportunity_id, start_time, end_time, is_recurring, recurring_pattern,
        organizer_name, admission_fee, is_indoors, electricity_access, booth_size,
        categories, weather_policy, application_link
    ) VALUES (
        v_opp_id, '09:00', '14:00', TRUE, 'Every Saturday',
        'Neighborhood Farmers Markets', 0.00, FALSE, FALSE, '10x10',
        ARRAY['Produce', 'Meat/Dairy', 'Foraged'], 'Rain or Shine', 'https://seattlefarmersmarkets.org'
    );

    ---------------------------------------------------------------------------
    -- 3. CONSIGNMENT SHOPS
    ---------------------------------------------------------------------------

    -- E. Crossroads Trading (Capitol Hill)
    INSERT INTO sales_opportunities (
        user_id, type, title, description, 
        address, latitude, longitude, 
        images, tags
    ) VALUES (
        v_user_id, 'CONSIGNMENT', 'Crossroads Trading - Capitol Hill', 
        'Fashionable and eco-conscious. We buy and sell gently used clothing for cash or trade. Looking for current trends and designer labels.',
        '325 Broadway E, Seattle, WA 98102', 47.6215, -122.3210,
        ARRAY['https://images.unsplash.com/photo-1441986300917-64674bd600d8'],
        ARRAY['fashion', 'clothing', 'buy-sell-trade', 'capitol hill']
    ) RETURNING id INTO v_opp_id;

    INSERT INTO consignment_details (
        opportunity_id, business_hours, open_days, 
        website, phone, social_media_links,
        accepted_items, excluded_brands, item_preparation,
        consignment_split, payout_method, contract_duration_days,
        appointment_required, intake_hours, drop_off_policy
    ) VALUES (
        v_opp_id, '{"mon": "11:00-19:00", "tue": "11:00-19:00", "wed": "11:00-19:00", "thu": "11:00-19:00", "fri": "11:00-19:00", "sat": "11:00-19:00", "sun": "11:00-19:00"}', ARRAY[0,1,2,3,4,5,6],
        'https://crossroadstrading.com', '(206) 328-5867', '{"instagram": "@crossroadstrading"}',
        ARRAY['Men''s Clothing', 'Women''s Clothing', 'Shoes', 'Accessories'], ARRAY['Fast Fashion (low quality)', 'Dated styles'], 'Clean and laundered',
        '50% Trade / 30% Cash', 'Cash or Trade Credit', NULL,
        TRUE, 'Check app for queue', 'Join waitlist via app'
    );

    -- F. Buffalo Exchange (Ballard)
    INSERT INTO sales_opportunities (
        user_id, type, title, description, 
        address, latitude, longitude, 
        images, tags
    ) VALUES (
        v_user_id, 'CONSIGNMENT', 'Buffalo Exchange - Ballard', 
        'Hip chain for buying, selling & trading trendy vintage & used clothing plus accessories. Located in the heart of Ballard.',
        '2232 NW Market St, Seattle, WA 98107', 47.6687, -122.3860,
        ARRAY['https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5'],
        ARRAY['vintage', 'trendy', 'ballard', 'resale']
    ) RETURNING id INTO v_opp_id;

    INSERT INTO consignment_details (
        opportunity_id, business_hours, open_days, 
        website, phone, social_media_links,
        accepted_items, excluded_brands, item_preparation,
        consignment_split, payout_method, contract_duration_days,
        appointment_required, intake_hours, drop_off_policy
    ) VALUES (
        v_opp_id, '{"mon": "11:00-19:00", "tue": "11:00-19:00", "wed": "11:00-19:00", "thu": "11:00-19:00", "fri": "11:00-19:00", "sat": "11:00-19:00", "sun": "11:00-19:00"}', ARRAY[0,1,2,3,4,5,6],
        'https://buffaloexchange.com', '(206) 297-5920', '{"instagram": "@buffaloexchange"}',
        ARRAY['Vintage', 'Designer', 'Everyday Staples'], NULL, 'Clean, good condition',
        '50% Trade / 25% Cash', 'Cash or Store Credit', NULL,
        TRUE, 'All day', 'Bring ID, sell in person'
    );

    -- G. Lucky Vintage
    INSERT INTO sales_opportunities (
        user_id, type, title, description, 
        address, latitude, longitude, 
        images, tags
    ) VALUES (
        v_user_id, 'CONSIGNMENT', 'Lucky Vintage', 
        'Curated vintage clothing shop in the U-District. Specializing in pieces from the 1920s to the 1990s.',
        '4742 University Way NE, Seattle, WA 98105', 47.6644, -122.3131,
        ARRAY['https://images.unsplash.com/photo-1551232864-3f0890e580d9'],
        ARRAY['vintage', 'udistrict', 'classic', 'boutique']
    ) RETURNING id INTO v_opp_id;

    INSERT INTO consignment_details (
        opportunity_id, business_hours, open_days, 
        website, phone, social_media_links,
        accepted_items, excluded_brands, item_preparation,
        consignment_split, payout_method, contract_duration_days,
        appointment_required, intake_hours, drop_off_policy
    ) VALUES (
        v_opp_id, '{"mon": "12:00-18:00", "tue": "12:00-18:00", "wed": "12:00-18:00", "thu": "12:00-18:00", "fri": "12:00-19:00", "sat": "11:00-19:00", "sun": "11:00-18:00"}', ARRAY[0,1,2,3,4,5,6],
        'https://luckyvintageseattle.com', '(206) 523-6621', '{"instagram": "@luckyvintageseattle"}',
        ARRAY['Pre-1990s Vintage', 'Denim', 'Leather'], ARRAY['Modern Brands'], 'Clean',
        '50/50', 'Check', 90,
        TRUE, 'By Appointment', 'Call to schedule'
    );
    
    RAISE NOTICE 'Data insertion complete. 7 Opportunities added.';

END $$;
