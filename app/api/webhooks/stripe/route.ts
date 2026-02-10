import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/utils/supabaseAdmin';

const STRIPE_API_VERSION = '2025-12-15.clover';

const getStripe = () => {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
        throw new Error('Missing STRIPE_SECRET_KEY');
    }

    return new Stripe(apiKey, {
        apiVersion: STRIPE_API_VERSION,
    });
};

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    try {
        const stripe = getStripe();
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!sig || !endpointSecret) {
            throw new Error('Missing Stripe signature or secret');
        }
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                const customerId = session.customer as string;
                const subscriptionId = session.subscription as string;

                if (userId && subscriptionId) {
                    await supabase
                        .from('subscriptions')
                        .upsert({
                            user_id: userId,
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            status: 'trialing', // Usually starts as trialing
                            updated_at: new Date().toISOString(),
                        }, { onConflict: 'user_id' });
                }
                break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                // Find user by stripe_subscription_id if strictly needed, or we rely on metadata if we stored it on subscription
                // For simplified logic, we might need to lookup the user via customer id.
                // But generally checkout.session.completed sets the link.

                const { data: existingSub } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_subscription_id', subscription.id)
                    .single();

                if (existingSub) {
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: subscription.status,
                            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .eq('stripe_subscription_id', subscription.id);
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                // Good for updating period end
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription as string;

                if (subscriptionId) {
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'active', // Confirmed active payment
                            updated_at: new Date().toISOString(),
                        })
                        .eq('stripe_subscription_id', subscriptionId);
                }
                break;
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
