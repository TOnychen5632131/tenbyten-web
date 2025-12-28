import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// Helper to get Google API Key
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const opportunity_id = searchParams.get('opportunity_id');
    const force = searchParams.get('force') === '1' || searchParams.get('force') === 'true';
    const debug = searchParams.get('debug') === '1' || searchParams.get('debug') === 'true';
    const debugInfo: Record<string, any> = {
        opportunity_id,
        force
    };

    if (!opportunity_id) {
        return NextResponse.json({ error: 'Opportunity ID required', ...(debug ? { debug: debugInfo } : {}) }, { status: 400 });
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
        debugInfo.cache_count = cached.length;

        // If we have reviews in DB, return them (Cache Hit)
        if (!force && cached.length > 0) {
            return NextResponse.json({
                source: 'CACHE',
                reviews: cached,
                ...(debug ? { debug: debugInfo } : {})
            });
        }

        // 2. If Cache Miss, we need to fetch from Google
        if (!GOOGLE_API_KEY) {
            console.error("Missing Google API Key");
            debugInfo.google_api_key_present = false;
            if (cached.length > 0) {
                return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
            }
            return NextResponse.json({ source: 'NONE', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
        }
        debugInfo.google_api_key_present = true;

        // 2a. Get the Opportunity details to know what to search for
        const { data: opportunity } = await supabase
            .from('sales_opportunities')
            .select('title, address, google_place_id')
            .eq('id', opportunity_id)
            .single();

        if (!opportunity) {
            return NextResponse.json({ error: 'Opportunity not found', ...(debug ? { debug: debugInfo } : {}) }, { status: 404 });
        }

        debugInfo.opportunity = {
            title: opportunity.title,
            address: opportunity.address,
            google_place_id: opportunity.google_place_id
        };

        let placeId = opportunity.google_place_id;

        // 2b. If we don't have a place_id yet, Search for it
        if (!placeId) {
            const query = [opportunity.title, opportunity.address].filter(Boolean).join(' ').trim();
            debugInfo.search_query = query;

            if (!query) {
                if (cached.length > 0) {
                    return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
                }
                return NextResponse.json({ source: 'GOOGLE_ZERO', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
            }

            const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;

            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();
            debugInfo.search_status = searchData?.status;
            debugInfo.search_error_message = searchData?.error_message;
            debugInfo.search_result_count = searchData?.results?.length || 0;

            if (!searchRes.ok) {
                console.warn("Google search HTTP error:", searchRes.status, searchRes.statusText);
            }
            if (searchData?.status && searchData.status !== 'OK') {
                console.warn("Google search status:", searchData.status, searchData.error_message || '');
                if (searchData.status === 'ZERO_RESULTS') {
                    if (cached.length > 0) {
                        return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
                    }
                    return NextResponse.json({ source: 'GOOGLE_ZERO', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
                }
                return NextResponse.json(
                    {
                        source: 'GOOGLE_SEARCH_ERROR',
                        reviews: [],
                        error: searchData?.error_message || `Google search error: ${searchData.status}`,
                        ...(debug ? { debug: debugInfo } : {})
                    },
                    { status: 502 }
                );
            }

            if (searchData.results && searchData.results.length > 0) {
                placeId = searchData.results[0].place_id;
                debugInfo.place_id = placeId;

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
                return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
            }
            return NextResponse.json({ source: 'GOOGLE_ZERO', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
        }

        // 3. Fetch Reviews using Place Details API
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${GOOGLE_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        debugInfo.details_status = detailsData?.status;
        debugInfo.details_error_message = detailsData?.error_message;

        if (!detailsRes.ok) {
            console.warn("Google details HTTP error:", detailsRes.status, detailsRes.statusText);
        }
        if (detailsData?.status && detailsData.status !== 'OK') {
            console.warn("Google details status:", detailsData.status, detailsData.error_message || '');
            if (detailsData.status === 'ZERO_RESULTS') {
                if (cached.length > 0) {
                    return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
                }
                return NextResponse.json({ source: 'GOOGLE_ZERO', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
            }
            return NextResponse.json(
                {
                    source: 'GOOGLE_DETAILS_ERROR',
                    reviews: [],
                    error: detailsData?.error_message || `Google details error: ${detailsData.status}`,
                    ...(debug ? { debug: debugInfo } : {})
                },
                { status: 502 }
            );
        }

        if (!detailsData?.result) {
            if (cached.length > 0) {
                return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
            }
            return NextResponse.json({ source: 'GOOGLE_ERROR', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
        }

        const googleReviews = detailsData.result?.reviews || [];
        debugInfo.details_review_count = googleReviews.length;
        debugInfo.details_rating = detailsData.result?.rating;
        debugInfo.details_user_ratings_total = detailsData.result?.user_ratings_total;

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
            })),
            ...(debug ? { debug: debugInfo } : {})
        });

    } catch (error: any) {
        console.error("Review fetch error:", error);
        return NextResponse.json({ error: error.message, ...(debug ? { debug: debugInfo } : {}) }, { status: 500 });
    }
}
