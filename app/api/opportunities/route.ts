
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type GeocodeResult = {
    latitude: number;
    longitude: number;
    placeId?: string | null;
};

const normalizeAddress = (value: string | null | undefined) => {
    if (!value) return '';
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
};

const hasValidCoords = (latitude: unknown, longitude: unknown) => {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) return false;
    if (latitude === '' || longitude === '') return false;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    return !(lat === 0 && lng === 0);
};

const parseCoordinateInput = (value: unknown) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return num;
};

const getManualCoords = (latInput: unknown, lngInput: unknown) => {
    const latitude = parseCoordinateInput(latInput);
    const longitude = parseCoordinateInput(lngInput);
    if (latitude === null || longitude === null) return null;
    if (!hasValidCoords(latitude, longitude)) return null;
    return { latitude, longitude };
};

const coordsEqual = (aLat: number | null, aLng: number | null, bLat: number | null, bLng: number | null) => {
    if (aLat === null || aLng === null || bLat === null || bLng === null) return false;
    const epsilon = 1e-6;
    return Math.abs(aLat - bLat) < epsilon && Math.abs(aLng - bLng) < epsilon;
};

const geocodeAddress = async (query: string): Promise<GeocodeResult | null> => {
    if (!GOOGLE_API_KEY || !query) return null;

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
        console.warn('Geocode request failed:', res.status, res.statusText);
        return null;
    }

    const data = await res.json();
    if (data?.status && data.status !== 'OK') {
        console.warn('Geocode status:', data.status, data?.error_message || '');
        return null;
    }

    const result = data?.results?.[0];
    const location = result?.geometry?.location;
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        return null;
    }

    return {
        latitude: location.lat,
        longitude: location.lng,
        placeId: result?.place_id || null
    };
};

const buildMarketYearFilter = (year: string) => {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const seasonStartInYear = `and(season_start_date.gte.${yearStart},season_start_date.lte.${yearEnd})`;
    const seasonOverlapsYear = `and(season_start_date.lte.${yearEnd},season_end_date.gte.${yearStart})`;
    const recurringOpenSeason = `and(season_start_date.lte.${yearEnd},season_end_date.is.null,is_recurring.eq.true)`;

    const legacyStartInYear = `and(season_start_date.is.null,start_date.gte.${yearStart},start_date.lte.${yearEnd})`;
    const legacyOverlapsYear = `and(season_start_date.is.null,start_date.lte.${yearEnd},end_date.gte.${yearStart})`;
    const legacyRecurringOpen = `and(season_start_date.is.null,start_date.lte.${yearEnd},end_date.is.null,is_recurring.eq.true)`;
    const legacyRecurringNoDates = `and(season_start_date.is.null,start_date.is.null,is_recurring.eq.true)`;

    const tba = 'is_schedule_tba.eq.true';

    return [
        seasonStartInYear,
        seasonOverlapsYear,
        recurringOpenSeason,
        legacyStartInYear,
        legacyOverlapsYear,
        legacyRecurringOpen,
        legacyRecurringNoDates,
        tba
    ].join(',');
};

// GET: Fetch all or specific opportunity
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Pagination & Search params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'ALL';
    const year = searchParams.get('year');
    const sortBy = searchParams.get('sort_by') || 'created_at'; // created_at, season_start_date, application_deadline
    const sortOrder = searchParams.get('order') || 'desc'; // asc, desc

    try {
        if (id) {
            // Fetch single item with details
            const { data: opp, error } = await supabase
                .from('sales_opportunities')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Fetch details based on type
            let details = null;
            if (opp.type === 'MARKET') {
                const { data: mkt } = await supabase.from('market_details').select('*').eq('opportunity_id', id).single();
                details = mkt;
            } else if (opp.type === 'CONSIGNMENT') {
                const { data: con } = await supabase.from('consignment_details').select('*').eq('opportunity_id', id).single();
                details = con;
            }

            return NextResponse.json({ ...opp, ...details });
        } else {
            // SORTING STRATEGY
            // If sorting by fields in 'market_details', we must query that table first to get the ordered IDs.
            let orderedIds: string[] | null = null;
            let totalCount = 0;

            if (sortBy === 'season_start_date' || sortBy === 'application_deadline') {
                // 1. Query market_details with sort, pagination, and year/type filters implicitly
                let mktQuery = supabase
                    .from('market_details')
                    .select('opportunity_id, season_start_date', { count: 'exact' });

                // Apply Year Filter to market_details Query
                if (year) {
                    mktQuery = mktQuery.or(buildMarketYearFilter(year));
                }

                // Apply Ordering
                // Note: nullsFirst/Last might be needed
                mktQuery = mktQuery.order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false });

                // We need to fetch ALL matching IDs to ensure cross-table pagination is correct? 
                // Actually, if we paginate `market_details`, we lose `sales_opportunities` that are NOT markets (e.g. Consignments).
                // If the user selects "Sort by Application Deadline", implicitly they mainly care about Markets.
                // However, we must handle the "Type" filter.

                // If Type is ALL or MARKET, this works. If CONSIGNMENT, these fields don't exist, so we fallback.
                if (type === 'CONSIGNMENT') {
                    // Fallback to created_at for Consignments if they verify doesn't have these fields
                    // For now, proceed as if fallback
                    orderedIds = null;
                } else {
                    // Pagination
                    const from = (page - 1) * limit;
                    const to = from + limit - 1;

                    const { data: mktData, count, error } = await mktQuery.range(from, to);

                    if (!error && mktData) {
                        orderedIds = mktData.map(m => m.opportunity_id);
                        totalCount = count || 0;
                    }
                }
            }

            // MAIN QUERY
            let supabaseQuery = supabase
                .from('sales_opportunities')
                .select('*', { count: 'exact' });

            // Apply Filters
            if (type !== 'ALL') supabaseQuery = supabaseQuery.eq('type', type);
            if (query) supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,address.ilike.%${query}%`);

            // If we have orderedIds from the previous step, restrict query to these IDs
            if (orderedIds !== null) {
                if (orderedIds.length === 0) {
                    return NextResponse.json({ data: [], meta: { total: 0, page, limit, totalPages: 0 } });
                }
                supabaseQuery = supabaseQuery.in('id', orderedIds);
            } else {
                // Standard Year Filter (only if not already handled by orderedIds)
                if (year) {
                    const { data: mktIds } = await supabase
                        .from('market_details')
                        .select('opportunity_id')
                        .or(buildMarketYearFilter(year));
                    if (mktIds) {
                        const ids = mktIds.map(m => m.opportunity_id);
                        if (ids.length > 0) supabaseQuery = supabaseQuery.in('id', ids);
                        else if (!query) return NextResponse.json({ data: [], meta: { total: 0, page, limit, totalPages: 0 } });
                    }
                }

                // Standard Sort
                supabaseQuery = supabaseQuery.order(sortBy === 'created_at' ? 'created_at' : 'created_at', { ascending: sortOrder === 'asc' });

                // Pagination
                const from = (page - 1) * limit;
                const to = from + limit - 1;
                supabaseQuery = supabaseQuery.range(from, to);
            }

            // Execute Main Query
            const { data: opportunities, count, error } = await supabaseQuery;
            if (error) throw error;

            // If we used orderedIds, we must re-sort the results because .in() does not preserve order
            let resultData = opportunities || [];
            if (orderedIds !== null) {
                // Map ID to object
                const oppMap = new Map(resultData.map(o => [o.id, o]));
                // Reconstruct array in order
                resultData = orderedIds.map(id => oppMap.get(id)).filter(Boolean);
                // Use totalCount from the first query
            }

            if (resultData.length > 0) {
                const ids = resultData.map(o => o.id);
                // Fetch Details
                const { data: markets } = await supabase.from('market_details').select('*').in('opportunity_id', ids);
                const { data: consignments } = await supabase.from('consignment_details').select('*').in('opportunity_id', ids);

                const detailsMap = new Map();
                if (markets) markets.forEach(m => detailsMap.set(m.opportunity_id, m));
                if (consignments) consignments.forEach(c => detailsMap.set(c.opportunity_id, c));

                const mergedData = resultData.map(opp => {
                    const detail = detailsMap.get(opp.id);
                    return detail ? { ...opp, ...detail } : opp;
                });

                return NextResponse.json({
                    data: mergedData,
                    meta: {
                        total: orderedIds !== null ? totalCount : (count || 0),
                        page,
                        limit,
                        totalPages: Math.ceil((orderedIds !== null ? totalCount : (count || 0)) / limit)
                    }
                });
            }

            return NextResponse.json({
                data: [],
                meta: { total: orderedIds !== null ? totalCount : 0, page, limit, totalPages: 0 }
            });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove an opportunity
export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    try {
        const { error } = await supabase
            .from('sales_opportunities')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update Google Place ID
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, google_place_id } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('sales_opportunities')
            .update({ google_place_id: google_place_id || null })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update an opportunity
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, type, ...data } = body;

        if (!id || !type) {
            return NextResponse.json({ error: 'ID and Type required' }, { status: 400 });
        }

        console.log('Updating opportunity:', id, type);

        const { data: existingOpp, error: existingError } = await supabase
            .from('sales_opportunities')
            .select('address, latitude, longitude, google_place_id')
            .eq('id', id)
            .single();

        if (existingError) {
            console.warn('Failed to load existing opportunity for geocoding:', existingError);
        }

        const normalizedNext = normalizeAddress(data.address);
        const normalizedPrev = normalizeAddress(existingOpp?.address);
        const addressChanged = Boolean(normalizedNext) && normalizedNext !== normalizedPrev;

        const existingLat = parseCoordinateInput(existingOpp?.latitude);
        const existingLng = parseCoordinateInput(existingOpp?.longitude);
        const existingCoordsValid = hasValidCoords(existingLat, existingLng);

        const coordsCleared = data.latitude === '' || data.longitude === '';
        const manualCoords = getManualCoords(data.latitude, data.longitude);
        const manualMatchesExisting = manualCoords
            ? coordsEqual(manualCoords.latitude, manualCoords.longitude, existingLat, existingLng)
            : false;

        const shouldGeocode = Boolean(normalizedNext)
            && (coordsCleared || !manualCoords || (addressChanged && manualMatchesExisting))
            && (coordsCleared || addressChanged || !existingCoordsValid);

        let geocodeResult: GeocodeResult | null = null;
        if (shouldGeocode) {
            const query = [data.title, data.address].filter(Boolean).join(' ').trim();
            geocodeResult = await geocodeAddress(query);
        }

        // 1. Update base table
        const oppUpdate: Record<string, any> = {
            title: data.title,
            description: data.description,
            address: data.address,
            tags: data.tags || [],
            is_trending: data.is_trending || false
        };

        if (manualCoords && !shouldGeocode) {
            oppUpdate.latitude = manualCoords.latitude;
            oppUpdate.longitude = manualCoords.longitude;
        } else if (geocodeResult) {
            oppUpdate.latitude = geocodeResult.latitude;
            oppUpdate.longitude = geocodeResult.longitude;
            oppUpdate.google_place_id = geocodeResult.placeId ?? null;
        }

        const { error: oppError } = await supabase
            .from('sales_opportunities')
            .update(oppUpdate)
            .eq('id', id);

        if (oppError) throw oppError;

        // 2. Update details table
        let detailError;
        if (type === 'MARKET') {
            const isScheduleTba = data.is_schedule_tba === true;
            const { error } = await supabase
                .from('market_details')
                .update({
                    // Update seasonal dates
                    season_start_date: isScheduleTba ? null : (data.season_start_date || data.start_date || null),
                    season_end_date: isScheduleTba ? null : (data.season_end_date || data.end_date || null),
                    // Keep start/end date for compatibility if needed, or just standard fields
                    start_date: isScheduleTba ? null : (data.start_date || null),
                    end_date: isScheduleTba ? null : (data.end_date || null),

                    start_time: isScheduleTba ? null : (data.start_time || null),
                    end_time: isScheduleTba ? null : (data.end_time || null),
                    is_schedule_tba: isScheduleTba,
                    is_indoors: data.is_indoors,
                    electricity_access: data.electricity_access,
                    booth_size: data.booth_size || null,
                    vendor_count: parseInt(data.vendor_count) || null,
                    admission_fee: data.admission_fee || null,
                    application_link: data.website || null,
                    organizer_name: data.organizer_name || null,
                    categories: data.categories || [], // Update categories
                    is_recurring: isScheduleTba ? false : data.is_recurring,
                    recurring_pattern: isScheduleTba ? null : data.recurring_pattern,

                    // New Fields
                    application_start_date: data.application_start_date || null,
                    application_end_date: data.application_end_date || null,
                    additional_schedules: isScheduleTba ? [] : (data.additional_schedules || [])
                })
                .eq('opportunity_id', id);
            detailError = error;
        } else if (type === 'CONSIGNMENT') {
            const { error } = await supabase
                .from('consignment_details')
                .update({
                    accepted_items: data.accepted_items,
                    excluded_brands: data.excluded_brands,
                    consignment_split: data.consignment_split || null,
                    contract_duration_days: parseInt(data.contract_duration_days) || null,
                    intake_hours: data.intake_hours
                })
                .eq('opportunity_id', id);
            detailError = error;
        }

        if (detailError) throw detailError;

        // 3. Regenerate Embedding
        try {
            const { data: textData } = await supabase.rpc('get_searchable_text', { opportunity_id: id });
            if (textData) {
                const { generateEmbedding } = await import('@/utils/openai');
                const embedding = await generateEmbedding(textData);
                await supabase.from('sales_opportunities').update({ embedding }).eq('id', id);
                console.log('Embedding regenerated for:', id);
            }
        } catch (embError) {
            console.error('Embedding regeneration failed:', embError);
        }

        return NextResponse.json({ success: true, message: 'Updated successfully' });

    } catch (error: any) {
        console.error('Update failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, ...data } = body;

        console.log('Processing submission for:', type);

        const manualCoords = getManualCoords(data.latitude, data.longitude);
        const isScheduleTba = data.is_schedule_tba === true;
        const geocodeQuery = [data.title, data.address].filter(Boolean).join(' ').trim();
        const geocodeResult = manualCoords ? null : await geocodeAddress(geocodeQuery);

        // 1. Insert into base 'sales_opportunities' table
        const { data: oppData, error: oppError } = await supabase
            .from('sales_opportunities')
            .insert({
                type,
                title: data.title,
                description: data.description,
                address: data.address,
                latitude: manualCoords?.latitude ?? geocodeResult?.latitude ?? null,
                longitude: manualCoords?.longitude ?? geocodeResult?.longitude ?? null,
                google_place_id: geocodeResult?.placeId ?? null,
                tags: data.tags || [],
                is_trending: data.is_trending || false
            })
            .select('id')
            .single();

        if (oppError) {
            console.error('Error creating opportunity:', oppError);
            throw new Error(oppError.message);
        }

        const opportunityId = oppData.id;

        // 2. Insert into specific details table
        let detailError;

        if (type === 'MARKET') {
            const { error } = await supabase
                .from('market_details')
                .insert({
                    opportunity_id: opportunityId,
                    season_start_date: isScheduleTba ? null : (data.season_start_date || data.start_date || null),
                    season_end_date: isScheduleTba ? null : (data.season_end_date || data.end_date || null),
                    start_time: isScheduleTba ? null : (data.start_time || null),
                    end_time: isScheduleTba ? null : (data.end_time || null),
                    is_schedule_tba: isScheduleTba,
                    is_indoors: data.is_indoors,
                    electricity_access: data.electricity_access,
                    booth_size: data.booth_size || null,
                    vendor_count: parseInt(data.vendor_count) || null,
                    admission_fee: data.admission_fee || null,
                    application_link: data.website || null,
                    organizer_name: data.organizer_name || null,

                    categories: data.categories || [],
                    is_recurring: isScheduleTba ? false : (data.is_recurring || false),
                    recurring_pattern: isScheduleTba ? null : (data.recurring_pattern || null),

                    // New Fields
                    application_start_date: data.application_start_date || null,
                    application_end_date: data.application_end_date || null,
                    additional_schedules: isScheduleTba ? [] : (data.additional_schedules || [])
                });
            detailError = error;
        } else if (type === 'CONSIGNMENT') {
            const { error } = await supabase
                .from('consignment_details')
                .insert({
                    opportunity_id: opportunityId,
                    accepted_items: data.accepted_items,
                    excluded_brands: data.excluded_brands,
                    consignment_split: data.consignment_split || null,
                    contract_duration_days: parseInt(data.contract_duration_days) || null,
                    intake_hours: data.intake_hours,
                    open_days: [] // Default empty or parse from input if we added that UI
                });
            detailError = error;
        }

        if (detailError) {
            console.error('Error creating details:', detailError);
            // Optionally rollback opportunity here
            throw new Error(detailError.message);
        }

        // 3. Generate and Save Search Embedding (Async but awaiting for simplicity/consistency)
        try {
            // Re-fetch full text using the SQL function we created
            const { data: textData, error: textError } = await supabase
                .rpc('get_searchable_text', { opportunity_id: opportunityId });

            if (textError) {
                console.error('Error fetching text for embedding:', textError);
            } else if (textData) {
                const { generateEmbedding } = await import('@/utils/openai');
                const embedding = await generateEmbedding(textData);

                // Update the row with the embedding
                await supabase
                    .from('sales_opportunities')
                    .update({ embedding })
                    .eq('id', opportunityId);

                console.log('Embedding generated and saved for:', opportunityId);
            }
        } catch (embError) {
            console.error('Embedding generation failed (non-critical):', embError);
            // We don't fail the whole request if AI fails, just log it.
        }

        return NextResponse.json({ success: true, message: 'Data saved successfully to Supabase' });
    } catch (error: any) {
        console.error('Submission failed:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to save data' }, { status: 500 });
    }
}
