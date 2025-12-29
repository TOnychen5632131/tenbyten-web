
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        console.log('Fetching form suggestions...');

        // We will fetch all data for these columns and aggregate in memory for simplicity 
        // given the dataset size (hundreds/thousands), to avoid complex SQL grouping helper functions 
        // if we don't have them. 
        // However, Supabase/PostgREST doesn't support convenient "select distinct count" in one go easily via JS client 
        // without RPC or raw SQL.
        // A simple approach: fetch all non-null values for the target columns.

        const { data, error } = await supabase
            .from('market_details')
            .select('organizer_name, booth_size, start_time, end_time');

        if (error) throw error;

        if (!data || data.length === 0) {
            return NextResponse.json({
                organizer_name: [],
                booth_size: [],
                start_time: [],
                end_time: []
            });
        }

        // Aggregation Helper
        const getTopValues = (key: keyof typeof data[0]) => {
            const counts: Record<string, number> = {};
            data.forEach(row => {
                const val = row[key];
                if (val && typeof val === 'string' && val.trim() !== '') {
                    counts[val] = (counts[val] || 0) + 1;
                }
            });

            return Object.entries(counts)
                .sort((a, b) => b[1] - a[1]) // Sort by frequency desc
                .slice(0, 5) // Take top 5
                .map(([val]) => val);
        };

        const suggestions = {
            organizer_name: getTopValues('organizer_name'),
            booth_size: getTopValues('booth_size'),
            start_time: getTopValues('start_time'),
            end_time: getTopValues('end_time'),
        };

        return NextResponse.json(suggestions);
    } catch (error: any) {
        console.error('Error fetching suggestions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
