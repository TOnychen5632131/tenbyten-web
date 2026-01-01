-- Customer support messages from the floating widget
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    page_url TEXT,
    user_agent TEXT,
    source TEXT NOT NULL DEFAULT 'floating_chat',
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS support_messages_thread_id_idx
    ON public.support_messages (thread_id);

CREATE INDEX IF NOT EXISTS support_messages_created_at_idx
    ON public.support_messages (created_at DESC);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert support messages" ON public.support_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read support messages" ON public.support_messages
    FOR SELECT USING (true);
