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
        // 1. Get the Opportunity details first (needed for stats and search info)
        const { data: opportunity } = await supabase
            .from('sales_opportunities')
            .select('title, address, google_place_id, google_reviews_fetched_at, google_reviews_status, google_reviews_count, google_rating, google_user_ratings_total')
            .eq('id', opportunity_id)
            .single();

        if (!opportunity) {
            return NextResponse.json({ error: 'Opportunity not found', ...(debug ? { debug: debugInfo } : {}) }, { status: 404 });
        }

        debugInfo.opportunity = {
            title: opportunity.title,
            address: opportunity.address,
            google_place_id: opportunity.google_place_id,
            google_reviews_fetched_at: opportunity.google_reviews_fetched_at,
            google_reviews_status: opportunity.google_reviews_status,
            google_reviews_count: opportunity.google_reviews_count,
            google_rating: opportunity.google_rating,
            google_user_ratings_total: opportunity.google_user_ratings_total
        };

        // 2. Check Cache (Database)
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

        // If we have reviews in DB, return them (Cache Hit) along with stats
        if (!force && cached.length > 0) {
            return NextResponse.json({
                source: 'CACHE',
                reviews: cached,
                stats: {
                    rating: opportunity.google_rating,
                    count: opportunity.google_user_ratings_total
                },
                ...(debug ? { debug: debugInfo } : {})
            });
        }

        if (!force && cached.length === 0) {
            // Note: If cache is empty but we have an opportunity, we might want to try fetching unless we know it's zero
            // For now, keeping original logic but respecting 'force'
            return NextResponse.json({
                source: 'CACHE_EMPTY',
                reviews: [],
                stats: {
                    rating: opportunity.google_rating,
                    count: opportunity.google_user_ratings_total
                },
                ...(debug ? { debug: debugInfo } : {})
            });
        }

        const updateReviewMeta = async (updates: Record<string, any>) => {
            if (!opportunity_id) return;
            const payload = { ...updates };
            if (!payload.google_reviews_fetched_at) {
                payload.google_reviews_fetched_at = new Date().toISOString();
            }
            const { error } = await supabase
                .from('sales_opportunities')
                .update(payload)
                .eq('id', opportunity_id);

            if (error) console.error("Review meta update error:", error);
        };

        // 3. If Cache Miss, we need to fetch from Google
        if (!GOOGLE_API_KEY) {
            console.error("Missing Google API Key");
            debugInfo.google_api_key_present = false;
            await updateReviewMeta({ google_reviews_status: 'NO_API_KEY' });
            if (cached.length > 0) {
                return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
            }
            return NextResponse.json({ source: 'NONE', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
        }
        debugInfo.google_api_key_present = true;

        let placeId = opportunity.google_place_id;

        // 3a. If we don't have a place_id yet, Search for it
        if (!placeId) {
            const query = [opportunity.title, opportunity.address].filter(Boolean).join(' ').trim();
            debugInfo.search_query = query;

            if (!query) {
                await updateReviewMeta({ google_reviews_status: 'NO_QUERY', google_reviews_count: 0 });
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
                    await updateReviewMeta({ google_reviews_status: 'ZERO_RESULTS', google_reviews_count: 0 });
                    if (cached.length > 0) {
                        return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
                    }
                    return NextResponse.json({ source: 'GOOGLE_ZERO', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
                }
                await updateReviewMeta({
                    google_reviews_status: `SEARCH_${searchData.status || 'ERROR'}`,
                    google_reviews_count: 0
                });
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
            await updateReviewMeta({ google_reviews_status: 'ZERO_RESULTS', google_reviews_count: 0 });
            if (cached.length > 0) {
                return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
            }
            return NextResponse.json({ source: 'GOOGLE_ZERO', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
        }

        // 4. Fetch Reviews using Place Details API
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
                await updateReviewMeta({ google_reviews_status: 'ZERO_RESULTS', google_reviews_count: 0 });
                if (cached.length > 0) {
                    return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
                }
                return NextResponse.json({ source: 'GOOGLE_ZERO', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
            }
            await updateReviewMeta({
                google_reviews_status: `DETAILS_${detailsData.status || 'ERROR'}`,
                google_reviews_count: 0
            });
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
            await updateReviewMeta({ google_reviews_status: 'NO_RESULT', google_reviews_count: 0 });
            if (cached.length > 0) {
                return NextResponse.json({ source: 'CACHE', reviews: cached, ...(debug ? { debug: debugInfo } : {}) });
            }
            return NextResponse.json({ source: 'GOOGLE_ERROR', reviews: [], ...(debug ? { debug: debugInfo } : {}) });
        }

        const googleReviews = detailsData.result?.reviews || [];
        debugInfo.details_review_count = googleReviews.length;
        debugInfo.details_rating = detailsData.result?.rating;
        debugInfo.details_user_ratings_total = detailsData.result?.user_ratings_total;

        const googleRating = typeof detailsData.result?.rating === 'number' ? detailsData.result.rating : null;
        const googleUserRatingsTotal = typeof detailsData.result?.user_ratings_total === 'number'
            ? detailsData.result.user_ratings_total
            : null;

        const limitedReviews = googleReviews.slice(0, 1);
        debugInfo.limited_review_count = limitedReviews.length;

        const metaUpdate: Record<string, any> = {
            google_reviews_status: 'OK',
            google_reviews_count: googleReviews.length
        };
        if (googleRating !== null) metaUpdate.google_rating = googleRating;
        if (googleUserRatingsTotal !== null) metaUpdate.google_user_ratings_total = googleUserRatingsTotal;
        await updateReviewMeta(metaUpdate);

        // 5. Cache them in Database
        if (limitedReviews.length > 0 && cached.length === 0) {
            const rowsToInsert = limitedReviews.map((r: any) => ({
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
                .upsert(rowsToInsert, {
                    onConflict: 'opportunity_id,author_name,text',
                    ignoreDuplicates: true
                });

            if (insertError) console.error("Cache insert error:", insertError);
        }

        return NextResponse.json({
            source: 'GOOGLE_LIVE',
            reviews: limitedReviews.map((r: any) => ({
                author_name: r.author_name,
                author_photo_url: r.profile_photo_url,
                rating: r.rating,
                text: r.text,
                original_date: r.relative_time_description
            })),
            stats: {
                rating: googleRating,
                count: googleUserRatingsTotal
            },
            ...(debug ? { debug: debugInfo } : {})
        });

    } catch (error: any) {
        console.error("Review fetch error:", error);
        return NextResponse.json({ error: error.message, ...(debug ? { debug: debugInfo } : {}) }, { status: 500 });
    }
}
