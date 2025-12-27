
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// GET: Fetch all or specific opportunity
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

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
            // Fetch list
            const { data, error } = await supabase
                .from('sales_opportunities')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return NextResponse.json(data);
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

// PUT: Update an opportunity
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, type, ...data } = body;

        if (!id || !type) {
            return NextResponse.json({ error: 'ID and Type required' }, { status: 400 });
        }

        console.log('Updating opportunity:', id, type);

        // 1. Update base table
        const { error: oppError } = await supabase
            .from('sales_opportunities')
            .update({
                title: data.title,
                description: data.description,
                address: data.address,
                tags: [] // defaulting for now or keep existing? Ideally handle tags
            })
            .eq('id', id);

        if (oppError) throw oppError;

        // 2. Update details table
        let detailError;
        if (type === 'MARKET') {
            const { error } = await supabase
                .from('market_details')
                .update({
                    start_date: data.start_date || null,
                    end_date: data.end_date || null,
                    start_time: data.start_time || null,
                    end_time: data.end_time || null,
                    is_indoors: data.is_indoors,
                    electricity_access: data.electricity_access,
                    booth_size: data.booth_size,
                    vendor_count: parseInt(data.vendor_count) || null,
                    admission_fee: data.admission_fee
                })
                .eq('opportunity_id', id);
            detailError = error;
        } else if (type === 'CONSIGNMENT') {
            const { error } = await supabase
                .from('consignment_details')
                .update({
                    accepted_items: data.accepted_items,
                    excluded_brands: data.excluded_brands,
                    consignment_split: data.consignment_split,
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

        // 1. Insert into base 'sales_opportunities' table
        const { data: oppData, error: oppError } = await supabase
            .from('sales_opportunities')
            .insert({
                type,
                title: data.title,
                description: data.description,
                address: data.address,
                // In a real app, geocode address to lat/lng here
                latitude: 0,
                longitude: 0,
                tags: [] // defaulting for now
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
                    start_date: data.start_date || null,
                    end_date: data.end_date || null,
                    start_time: data.start_time || null,
                    end_time: data.end_time || null,
                    is_indoors: data.is_indoors,
                    electricity_access: data.electricity_access,
                    booth_size: data.booth_size,
                    vendor_count: parseInt(data.vendor_count) || null,
                    admission_fee: data.admission_fee
                });
            detailError = error;
        } else if (type === 'CONSIGNMENT') {
            const { error } = await supabase
                .from('consignment_details')
                .insert({
                    opportunity_id: opportunityId,
                    accepted_items: data.accepted_items,
                    excluded_brands: data.excluded_brands,
                    consignment_split: data.consignment_split,
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
