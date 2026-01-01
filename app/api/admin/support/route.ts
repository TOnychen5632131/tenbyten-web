import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('support_messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch messages.' },
            { status: 500 }
        );
    }
}
