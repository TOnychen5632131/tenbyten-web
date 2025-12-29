import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            company,
            location,
            partnershipType,
            website,
            message
        } = body || {};

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required.' },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Please provide a valid email.' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('collaboration_requests')
            .insert({
                name: String(name).trim(),
                email: String(email).trim(),
                company: company ? String(company).trim() : null,
                location: location ? String(location).trim() : null,
                partnership_type: partnershipType ? String(partnershipType).trim() : null,
                website: website ? String(website).trim() : null,
                message: String(message).trim(),
                status: 'NEW'
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to submit request.' },
            { status: 500 }
        );
    }
}
