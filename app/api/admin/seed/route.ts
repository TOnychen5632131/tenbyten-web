import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { generateEmbedding } from '@/utils/openai';
import fs from 'fs';
import path from 'path';

// Prevent this route from being cached
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Read the JSON file
        const filePath = path.join(process.cwd(), 'seattle_markets.json');

        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: 'seattle_markets.json not found in project root' },
                { status: 404 }
            );
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const markets = JSON.parse(fileContent);

        console.log(`🌱 [Seed] Found ${markets.length} markets to process...`);

        const results = [];

        for (const market of markets) {
            console.log(`Processing: ${market.title}`);

            // 2. Generate Embedding
            // We combine title, description, tags, and categories for a rich semantic representation
            const textToEmbed = `
                Title: ${market.title}
                Type: ${market.type}
                Description: ${market.description}
                Tags: ${market.tags?.join(', ')}
                Categories: ${market.market_details?.categories?.join(', ')}
                Location: ${market.address}
                Pattern: ${market.market_details?.recurring_pattern}
            `.trim();

            let embedding = null;
            try {
                embedding = await generateEmbedding(textToEmbed);
            } catch (e) {
                console.error(`Failed to generate embedding for ${market.title}`, e);
                results.push({ title: market.title, status: 'failed_embedding', error: e });
                continue;
            }

            // 3. Upsert into sales_opportunities
            // Note: We need a consistent ID. For now, we'll try to find by title or generate a deterministic one based on title if possible, 
            // but for simplicity in this seed script, we might let Supabase handle it or query first.
            // A better approach for idempotency: Select ID by title, if exists update, else insert.

            const { data: existing } = await supabase
                .from('sales_opportunities')
                .select('id')
                .eq('title', market.title)
                .maybeSingle();

            let opportunityId = existing?.id;

            const opportunityData = {
                title: market.title,
                description: market.description,
                type: market.type,
                address: market.address,
                latitude: market.latitude,
                longitude: market.longitude,
                images: market.images,
                tags: market.tags,
                embedding: embedding,
                // Assuming we might want to update these fields if they changed
            };

            let opError;
            if (opportunityId) {
                const { error } = await supabase
                    .from('sales_opportunities')
                    .update(opportunityData)
                    .eq('id', opportunityId);
                opError = error;
            } else {
                const { data: newOp, error } = await supabase
                    .from('sales_opportunities')
                    .insert(opportunityData)
                    .select('id')
                    .single();
                opError = error;
                if (newOp) opportunityId = newOp.id;
            }

            if (opError) {
                console.error(`DB Error for ${market.title}:`, opError);
                results.push({ title: market.title, status: 'db_error', error: opError });
                continue;
            }

            // 4. Upsert market_details
            if (market.market_details && opportunityId) {
                const details = market.market_details;

                // Check if details exist
                const { data: existingDetails } = await supabase
                    .from('market_details')
                    .select('id')
                    .eq('opportunity_id', opportunityId)
                    .maybeSingle();

                const detailsData = {
                    opportunity_id: opportunityId,
                    start_time: details.start_time,
                    end_time: details.end_time,
                    is_recurring: details.is_recurring,
                    recurring_pattern: details.recurring_pattern,
                    organizer_name: details.organizer_name,
                    admission_fee: details.admission_fee,
                    is_indoors: details.is_indoors,
                    electricity_access: details.electricity_access,
                    booth_size: details.booth_size,
                    categories: details.categories,
                    weather_policy: details.weather_policy,
                    application_link: details.application_link,
                    season_start_date: details.season_start_date,
                    season_end_date: details.season_end_date
                };

                let detailError;
                if (existingDetails) {
                    const { error } = await supabase
                        .from('market_details')
                        .update(detailsData)
                        .eq('opportunity_id', opportunityId);
                    detailError = error;
                } else {
                    const { error } = await supabase
                        .from('market_details')
                        .insert(detailsData);
                    detailError = error;
                }

                if (detailError) {
                    console.error(`Detail DB Error for ${market.title}:`, detailError);
                    results.push({ title: market.title, status: 'detail_db_error', error: detailError });
                } else {
                    results.push({ title: market.title, status: 'success', id: opportunityId });
                }
            } else {
                results.push({ title: market.title, status: 'success_no_details', id: opportunityId });
            }
        }

        return NextResponse.json({
            message: 'Seeding completed',
            results
        });

    } catch (error: any) {
        console.error('Seeding fatal error:', error);
        return NextResponse.json(
            { error: 'Seeding failed', details: error.message },
            { status: 500 }
        );
    }
}
