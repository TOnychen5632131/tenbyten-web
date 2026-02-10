import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/utils/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover', // Using latest or matching checkout version
});

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = getSupabaseAdmin();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get customer ID
        const { data: subData } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        if (!subData?.stripe_customer_id) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
        }

        // Create Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: subData.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/onboarding`,
        });

        return NextResponse.json({ url: session.url });

    } catch (err: any) {
        console.error('Portal Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
