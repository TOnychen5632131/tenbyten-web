import { supabase } from '@/utils/supabase';
import { generateEmbedding, openai } from '@/utils/openai';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        // 1. Interpret Query with LLM to extract intent (dates, keywords)
        const interpretationCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a search query interpreter. Extract the user's intent.
                    Output JSON with:
                    - keywords: string (core topic)
                    - targetDate: string (YYYY-MM-DD) if a time is mentioned. Use the start date if a range/week is mentioned.
                    - dayOfWeek: string (Full English Name, e.g. "Sunday") ONLY if the user explicitly mentions a specific day of the week. If they just say "next week" or "tomorrow", leave this null.
                    - location: string if mentioned.
                    
                    Today is ${new Date().toISOString().split('T')[0]}.`
                },
                { role: "user", content: query }
            ],
            response_format: { type: "json_object" }
        });

        const interpretationStr = interpretationCompletion.choices[0].message.content;
        const interpretation = interpretationStr ? JSON.parse(interpretationStr) : {};
        console.log("🤖 [AI Search] Interpretation:", JSON.stringify(interpretation, null, 2));
        const { keywords, targetDate, dayOfWeek } = interpretation;

        // 2. Generate Embedding for the Keywords (or full query if no keywords)
        const textToEmbed = keywords || query;
        const embedding = await generateEmbedding(textToEmbed);

        // 3. Call RPC for Vector Search
        console.log("🔍 [AI Search] Executing Vector Search...");
        const { data: vectorResults, error } = await supabase
            .rpc('match_opportunities', {
                query_embedding: embedding,
                match_threshold: 0.1, // Lower threshold to ensure results
                match_count: 20
            });

        if (error) {
            console.error("❌ [AI Search] Vector search error:", error);
            throw error;
        }

        let results = vectorResults || [];
        console.log(`✅ [AI Search] Vector Search found ${results.length} raw matches.`);

        // 4. Post-processing Filter & Merge Details
        if (results.length > 0) {
            const ids = results.map((r: any) => r.id);

            // Fetch Market Details
            const { data: marketDetails } = await supabase
                .from('market_details')
                .select('*') // Fetch ALL details for UI
                .in('opportunity_id', ids);

            // Fetch Consignment Details (if any shop types exist)
            const { data: consignmentDetails } = await supabase
                .from('consignment_details')
                .select('*')
                .in('opportunity_id', ids);

            const detailsMap = new Map();
            if (marketDetails) marketDetails.forEach((d: any) => detailsMap.set(d.opportunity_id, d));
            if (consignmentDetails) consignmentDetails.forEach((d: any) => detailsMap.set(d.opportunity_id, d));

            results = results.map((r: any) => {
                const detail = detailsMap.get(r.id);
                // Merge detail into result
                return detail ? { ...r, ...detail } : r;
            });

            // Apply Filters (Date/Seasonality)
            if (targetDate) {
                console.log(`📅 [AI Search] Filtering against Date: ${targetDate}`);
                const dateObj = new Date(targetDate);

                results = results.filter((r: any) => {
                    // Only filter Markets by date/season
                    if (r.type !== 'MARKET') return true;

                    let keep = true;
                    // Seasonality Check
                    if (r.season_start_date && r.season_end_date) {
                        const start = new Date(r.season_start_date);
                        const end = new Date(r.season_end_date);
                        if (dateObj < start || dateObj > end) {
                            keep = false;
                            // console.log(`   ⛔ Filtered out "${r.title}": Out of season`);
                        }
                    }

                    // Day of Week Check
                    if (keep && dayOfWeek && r.recurring_pattern) {
                        const pattern = r.recurring_pattern.toLowerCase();
                        const dayTarget = dayOfWeek.toLowerCase();
                        if (!pattern.includes(dayTarget) && !pattern.includes('daily')) {
                            keep = false;
                            // console.log(`   ⛔ Filtered out "${r.title}": Wrong day`);
                        }
                    }
                    return keep;
                });
            }
        }



        console.log(`🚀 [AI Search] Final Results: ${results.length} items`);

        return NextResponse.json({
            results: results.slice(0, 5), // Return top 5 after filtering
            meta: interpretation
        });

    } catch (err: any) {
        console.error('Search error:', err);
        return NextResponse.json(
            { error: 'Search failed', details: err.message },
            { status: 500 }
        );
    }
}
