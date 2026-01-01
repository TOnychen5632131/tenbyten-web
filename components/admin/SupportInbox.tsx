'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Link2, Mail, MessageCircle } from 'lucide-react';

type SupportMessage = {
    id: string;
    thread_id: string;
    email: string;
    message: string;
    page_url?: string | null;
    user_agent?: string | null;
    source?: string | null;
    status?: string | null;
    created_at?: string | null;
};

const formatDate = (value?: string | null) => {
    if (!value) return 'Unknown date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
};

const SupportInbox = () => {
    const [items, setItems] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch('/api/admin/support');
                const json = await res.json();
                if (!res.ok || json?.error) {
                    throw new Error(json?.error || 'Failed to fetch messages.');
                }
                setItems(Array.isArray(json?.data) ? json.data : []);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch messages.');
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, []);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 bg-white/5 rounded-2xl" />
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="text-red-400">{error}</div>;
    }

    if (items.length === 0) {
        return (
            <div className="text-white/50 text-sm">
                No support messages yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-5 md:p-6"
                >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="text-lg font-semibold text-white">
                                {item.email || 'Unknown sender'}
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-white/60">
                                <span className="inline-flex items-center gap-1">
                                    <MessageCircle size={14} />
                                    {item.thread_id ? item.thread_id.slice(0, 8) + '…' : 'No thread'}
                                </span>
                                {item.page_url && (
                                    <span className="inline-flex items-center gap-1">
                                        <Link2 size={14} />
                                        <a
                                            href={item.page_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-white transition-colors"
                                        >
                                            Page
                                        </a>
                                    </span>
                                )}
                                {item.source && (
                                    <span className="inline-flex items-center gap-1">
                                        <Mail size={14} />
                                        {item.source}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 text-xs text-white/50">
                            <span className="inline-flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(item.created_at)}
                            </span>
                            <span className="inline-flex items-center gap-2 uppercase tracking-[0.2em]">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                {item.status || 'unread'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                        {item.message || 'No message provided.'}
                    </div>

                    {item.user_agent && (
                        <div className="mt-3 text-xs text-white/40 break-words">
                            {item.user_agent}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SupportInbox;
