import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, message, pageUrl, threadId, source } = body || {};

        if (!email || !message || !threadId) {
            return NextResponse.json(
                { error: 'Email, message, and thread id are required.' },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Please provide a valid email.' },
                { status: 400 }
            );
        }

        const normalizedSource = source ? String(source).trim() : 'floating_chat';
        const userAgent = request.headers.get('user-agent');

        const { error } = await supabase
            .from('support_messages')
            .insert({
                thread_id: String(threadId).trim(),
                email: String(email).trim(),
                message: String(message).trim(),
                page_url: pageUrl ? String(pageUrl).trim() : null,
                user_agent: userAgent,
                source: normalizedSource || 'floating_chat',
                status: 'unread'
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
