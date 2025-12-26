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

        // 4. Post-processing Filter (Date/Seasonality)
        if (results.length > 0) {
            const ids = results.map((r: any) => r.id);
            const { data: fetchedDetails } = await supabase
                .from('market_details')
                .select('opportunity_id, season_start_date, season_end_date, recurring_pattern')
                .in('opportunity_id', ids);

            if (fetchedDetails) {
                const dateObj = targetDate ? new Date(targetDate) : new Date();
                console.log(`📅 [AI Search] Filtering against Date: ${dateObj.toISOString().split('T')[0]} (Target: ${targetDate || 'None'})`);
                const detailsMap = new Map(fetchedDetails.map((d: any) => [d.opportunity_id, d]));

                results = results.filter((r: any) => {
                    const detail = detailsMap.get(r.id);
                    if (!detail) return true;

                    let keep = true;
                    let rejectionReason = "";

                    // 1. Seasonality Check (Always apply if targetDate is present)
                    if (targetDate && detail.season_start_date && detail.season_end_date) {
                        const start = new Date(detail.season_start_date);
                        const end = new Date(detail.season_end_date);
                        // Check if the target date is within the operational season year/range
                        // If "Next week" is 2026-01-01, we want to know if the market is open in 2026 generally?
                        // Yes, the simple range check works.
                        if (dateObj < start || dateObj > end) {
                            keep = false;
                            rejectionReason = `Out of season (${detail.season_start_date} ~ ${detail.season_end_date})`;
                        }
                    }

                    // 2. Day of Week Check (Only if dayOfWeek is explicitly mentioned)
                    if (keep && dayOfWeek && detail.recurring_pattern) {
                        const pattern = detail.recurring_pattern.toLowerCase();
                        const dayTarget = dayOfWeek.toLowerCase();

                        // If pattern doesn't contain the requested day (and isn't daily)
                        if (!pattern.includes(dayTarget) && !pattern.includes('daily')) {
                            keep = false;
                            rejectionReason = `Incorrect day (Pattern: ${detail.recurring_pattern}, Target: ${dayOfWeek})`;
                        }
                    }

                    if (!keep) {
                        console.log(`   ⛔ Filtered out "${r.title}": ${rejectionReason}`);
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
