import { supabase } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Helper to normalize dates (MM/DD/YYYY -> YYYY-MM-DD)
const normalizeDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    // Check if already in YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // Handle MM/DD/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        // Assume MM/DD/YYYY
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    return dateStr; // Return original if unknown format
};

// Helper to normalize time (9:00 AM -> 09:00:00)
// Can handle: "10:00 AM", "Wed, Sat 08:00 AM", "Thursday-Sunday 10:00 AM", "14:00"
// Returns null for "Sunset" or invalid formats
const normalizeTime = (timeStr: string | null | undefined): string | null => {
    if (!timeStr) return null;

    // 1. Try to find a time pattern: HH:MM followed optionally by :SS and AM/PM
    // Matches: "10:00", "10:00 AM", "10:00:00", " 9:00pm "
    const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i;
    const match = timeStr.match(timeRegex);

    if (!match) {
        // Handle special cases like "Sunset" strictly if needed, or just return null
        return null;
    }

    let [_, hoursStr, minutesStr, secondsStr, modifier] = match;

    let hours = parseInt(hoursStr);
    const minutes = minutesStr; // Already padded or 2 digits from regex
    const seconds = secondsStr || '00';

    if (modifier) {
        modifier = modifier.toLowerCase();
        const isPM = modifier.includes('pm') || modifier.includes('p.m.');
        const isAM = modifier.includes('am') || modifier.includes('a.m.');

        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
};

export async function POST(request: NextRequest) {
    // Uses the imported supabase instance directly

    try {
        let data = await request.json();

        // Handle wrapper object { items: [...] }
        if (!Array.isArray(data) && data.items && Array.isArray(data.items)) {
            data = data.items;
        }

        if (!Array.isArray(data)) {
            return NextResponse.json(
                { error: 'Input must be a JSON array or { items: [] }' },
                { status: 400 }
            );
        }

        const report = {
            success: 0,
            duplicates: 0,
            errors: 0,
            details: [] as string[],
        };

        for (const item of data) {
            const {
                type, title, description, address, latitude, longitude, images, tags,
                market_details, consignment_details
            } = item;

            // 1. Basic Validation
            if (!title || !type) {
                report.errors++;
                report.details.push(`Skipped item: Missing title or type.`);
                continue;
            }

            // 2. Deduplication Check
            const { data: existing } = await supabase
                .from('sales_opportunities')
                .select('id')
                .eq('type', type)
                .eq('title', title)
                .single();

            if (existing) {
                report.duplicates++;
                report.details.push(`Duplicate: "${title}" (${type}) already exists.`);
                continue;
            }

            // 3. Generate Embedding (Title + Description + Tags + Categories)
            let embedding = null;
            try {
                // Combine text for embedding
                const tagsStr = tags ? tags.join(' ') : '';
                const categoriesStr = market_details?.categories ? market_details.categories.join(' ') : '';
                const textToEmbed = `${title} ${description} ${type} ${tagsStr} ${categoriesStr}`;

                // Generate embedding using OpenAI
                const { generateEmbedding } = await import('@/utils/openai');
                embedding = await generateEmbedding(textToEmbed);

            } catch (embedError) {
                console.warn(`Failed to generate embedding for ${title}:`, embedError);
            }

            // 4. Insert into sales_opportunities
            const { data: newOpp, error: oppError } = await supabase
                .from('sales_opportunities')
                .insert({
                    type, title, description, address, latitude, longitude, images, tags,
                    embedding
                })
                .select('id')
                .single();

            if (oppError || !newOpp) {
                report.errors++;
                report.details.push(`Error inserting "${title}": ${oppError?.message}`);
                continue;
            }

            const oppId = newOpp.id;

            // 5. Insert Details based on Type
            if (type === 'MARKET' && market_details) {
                const {
                    start_time, end_time, is_recurring, recurring_pattern,
                    organizer_name, admission_fee, is_indoors, electricity_access, booth_size,
                    categories, weather_policy, application_link,
                    season_start_date, season_end_date // New fields
                } = market_details;

                const { error: mktError } = await supabase
                    .from('market_details')
                    .insert({
                        opportunity_id: oppId,
                        start_time: normalizeTime(start_time),
                        end_time: normalizeTime(end_time),
                        is_recurring, recurring_pattern,
                        organizer_name, admission_fee, is_indoors, electricity_access, booth_size,
                        categories, weather_policy, application_link,
                        season_start_date: normalizeDate(season_start_date),
                        season_end_date: normalizeDate(season_end_date)
                    });

                if (mktError) {
                    report.errors++;
                    report.details.push(`Error inserting details for Market "${title}": ${mktError.message}`);
                    continue;
                }
            } else if (type === 'CONSIGNMENT' && consignment_details) {
                const { error: conError } = await supabase
                    .from('consignment_details')
                    .insert({
                        opportunity_id: oppId,
                        ...consignment_details
                    });

                if (conError) {
                    report.errors++;
                    report.details.push(`Error inserting details for Shop "${title}": ${conError.message}`);
                    continue;
                }
            }

            report.success++;
        }

        return NextResponse.json({ report });

    } catch (err: any) {
        return NextResponse.json(
            { error: 'Internal Server Error', details: err.message },
            { status: 500 }
        );
    }
}
