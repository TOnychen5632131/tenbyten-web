import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// Helper to get Google API Key
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const opportunity_id = searchParams.get('opportunity_id');
    const force = searchParams.get('force') === '1' || searchParams.get('force') === 'true';

    if (!opportunity_id) {
        return NextResponse.json({ error: 'Opportunity ID required' }, { status: 400 });
    }

    try {
        // 1. Check Cache (Database) first
        const { data: cachedReviews, error: dbError } = await supabase
            .from('opportunity_reviews')
            .select('*')
            .eq('opportunity_id', opportunity_id)
            .order('cached_at', { ascending: false });

        if (dbError) {
            console.error("Cache read error:", dbError);
        }

        const cached = cachedReviews || [];

        // If we have reviews in DB, return them (Cache Hit)
        if (!force && cached.length > 0) {
            return NextResponse.json({
                source: 'CACHE',
                reviews: cached
            });
        }

        // 2. If Cache Miss, we need to fetch from Google
        if (!GOOGLE_API_KEY) {
            console.error("Missing Google API Key");
            if (cached.length > 0) {
                return NextResponse.json({ source: 'CACHE', reviews: cached });
            }
            return NextResponse.json({ source: 'NONE', reviews: [] });
        }

        // 2a. Get the Opportunity details to know what to search for
        const { data: opportunity } = await supabase
            .from('sales_opportunities')
            .select('title, address, google_place_id')
            .eq('id', opportunity_id)
            .single();

        if (!opportunity) {
            return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
        }

        let placeId = opportunity.google_place_id;

        // 2b. If we don't have a place_id yet, Search for it
        if (!placeId) {
            const query = `${opportunity.title} ${opportunity.address}`;
            const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;

            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.results && searchData.results.length > 0) {
                placeId = searchData.results[0].place_id;

                // Save this Place ID so we don't search again
                await supabase
                    .from('sales_opportunities')
                    .update({ google_place_id: placeId })
                    .eq('id', opportunity_id);
            }
        }

        if (!placeId) {
            // Found nothing on Google
            if (cached.length > 0) {
                return NextResponse.json({ source: 'CACHE', reviews: cached });
            }
            return NextResponse.json({ source: 'GOOGLE_ZERO', reviews: [] });
        }

        // 3. Fetch Reviews using Place Details API
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${GOOGLE_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (!detailsData?.result) {
            if (cached.length > 0) {
                return NextResponse.json({ source: 'CACHE', reviews: cached });
            }
            return NextResponse.json({ source: 'GOOGLE_ERROR', reviews: [] });
        }

        const googleReviews = detailsData.result?.reviews || [];

        if (force && cached.length > 0) {
            const { error: deleteError } = await supabase
                .from('opportunity_reviews')
                .delete()
                .eq('opportunity_id', opportunity_id);

            if (deleteError) console.error("Cache delete error:", deleteError);
        }

        // 4. Cache them in Database
        if (googleReviews.length > 0) {
            const rowsToInsert = googleReviews.map((r: any) => ({
                opportunity_id: opportunity_id,
                author_name: r.author_name,
                author_photo_url: r.profile_photo_url,
                rating: r.rating,
                text: r.text,
                original_date: r.relative_time_description,
                source_url: r.author_url // Linking to author map profile as source
            }));

            const { error: insertError } = await supabase
                .from('opportunity_reviews')
                .insert(rowsToInsert);

            if (insertError) console.error("Cache insert error:", insertError);
        }

        return NextResponse.json({
            source: 'GOOGLE_LIVE',
            reviews: googleReviews.map((r: any) => ({
                author_name: r.author_name,
                author_photo_url: r.profile_photo_url,
                rating: r.rating,
                text: r.text,
                original_date: r.relative_time_description
            }))
        });

    } catch (error: any) {
        console.error("Review fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
