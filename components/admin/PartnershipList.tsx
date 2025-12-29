'use client';

import React, { useEffect, useState } from 'react';
import { Mail, MapPin, Globe, Building2, Calendar } from 'lucide-react';

type PartnershipRequest = {
    id: string;
    name: string;
    email: string;
    company?: string | null;
    location?: string | null;
    partnership_type?: string | null;
    website?: string | null;
    message?: string | null;
    status?: string | null;
    created_at?: string | null;
};

const formatDate = (value?: string | null) => {
    if (!value) return 'Unknown date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
};

const PartnershipList = () => {
    const [items, setItems] = useState<PartnershipRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await fetch('/api/admin/partnerships');
                const json = await res.json();
                if (!res.ok || json?.error) {
                    throw new Error(json?.error || 'Failed to fetch requests.');
                }
                setItems(Array.isArray(json?.data) ? json.data : []);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch requests.');
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
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
                No partnership requests yet.
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
                                {item.name || 'Unknown'}
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-white/60">
                                {item.email && (
                                    <span className="inline-flex items-center gap-1">
                                        <Mail size={14} />
                                        <a
                                            href={`mailto:${item.email}`}
                                            className="hover:text-white transition-colors"
                                        >
                                            {item.email}
                                        </a>
                                    </span>
                                )}
                                {item.company && (
                                    <span className="inline-flex items-center gap-1">
                                        <Building2 size={14} />
                                        {item.company}
                                    </span>
                                )}
                                {item.location && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin size={14} />
                                        {item.location}
                                    </span>
                                )}
                                {item.website && (
                                    <span className="inline-flex items-center gap-1">
                                        <Globe size={14} />
                                        <a
                                            href={item.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-white transition-colors"
                                        >
                                            {item.website}
                                        </a>
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
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                {item.status || 'NEW'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                        {item.partnership_type && (
                            <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                                {item.partnership_type}
                            </div>
                        )}
                        {item.message || 'No message provided.'}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PartnershipList;
