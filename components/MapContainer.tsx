'use client';
import React, { useEffect, useMemo, useState } from 'react';
import MapDateSelector from './MapDateSelector';
import MapFilterToggle from './MapFilterToggle';
import OpportunityDetail from './OpportunityDetail';

import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#1a1a1a] animate-pulse" />
});

type Opportunity = {
    id: string;
    type: 'MARKET' | 'CONSIGNMENT';
    title: string;
    latitude: number | string | null;
    longitude: number | string | null;
    season_start_date?: string | null;
    season_end_date?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    is_recurring?: boolean | null;
    recurring_pattern?: string | null;
    open_days?: Array<number | string> | null;
};

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const parseDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameDay = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
};

const getWeekOfMonth = (date: Date) => {
    return Math.floor((date.getDate() - 1) / 7) + 1;
};

const isLastWeekdayOfMonth = (date: Date) => {
    const next = new Date(date);
    next.setDate(date.getDate() + 7);
    return next.getMonth() !== date.getMonth();
};

const getDaysFromPattern = (pattern: string) => {
    const days: number[] = [];
    dayNames.forEach((name, idx) => {
        if (pattern.includes(name)) {
            days.push(idx);
        }
    });
    return days;
};

const matchesMonthlyPattern = (date: Date, pattern: string) => {
    const days = getDaysFromPattern(pattern);
    if (days.length > 0 && !days.includes(date.getDay())) return false;

    if (pattern.includes('last')) {
        return isLastWeekdayOfMonth(date);
    }

    const ordinalMatch = pattern.match(/\b(\d)(st|nd|rd|th)\b/);
    if (ordinalMatch) {
        const ordinal = parseInt(ordinalMatch[1], 10);
        return getWeekOfMonth(date) === ordinal;
    }

    return days.length > 0 ? days.includes(date.getDay()) : false;
};

const matchesRecurringPattern = (date: Date, patternRaw: string) => {
    const pattern = patternRaw.toLowerCase();

    if (pattern.includes('daily')) return true;
    if (pattern.includes('monthly')) return matchesMonthlyPattern(date, pattern);

    const days = getDaysFromPattern(pattern);
    if (days.length > 0) return days.includes(date.getDay());

    return true;
};

const isMarketOnDate = (item: Opportunity, date: Date) => {
    const seasonStart = parseDate(item.season_start_date ?? item.start_date);
    const seasonEnd = parseDate(item.season_end_date ?? item.end_date);

    if (seasonStart && date < seasonStart) return false;
    if (seasonEnd && date > seasonEnd) return false;

    if (!item.recurring_pattern) {
        if (item.is_recurring === false) {
            if (seasonStart && seasonEnd) return date >= seasonStart && date <= seasonEnd;
            if (seasonStart) return isSameDay(date, seasonStart);
        }
        return true;
    }

    return matchesRecurringPattern(date, item.recurring_pattern);
};

const isConsignmentOnDate = (item: Opportunity, date: Date) => {
    if (!item.open_days || item.open_days.length === 0) return true;
    const openDays = item.open_days.map((day) => Number(day)).filter((day) => Number.isFinite(day));
    return openDays.includes(date.getDay());
};

const MapContainer = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [filterType, setFilterType] = useState<'MARKET' | 'CONSIGNMENT'>('MARKET');
    const [items, setItems] = useState<Opportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

    useEffect(() => {
        let isActive = true;
        const pageSize = 200;

        const fetchPage = async (page: number) => {
            const res = await fetch(`/api/opportunities?page=${page}&limit=${pageSize}&year=2026`);
            if (!res.ok) {
                throw new Error(`Failed to load opportunities (${res.status})`);
            }
            const json = await res.json();
            const data = Array.isArray(json) ? json : (json.data || []);
            const meta = Array.isArray(json) ? { totalPages: 1 } : (json.meta || { totalPages: 1 });
            return { data, meta };
        };

        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const first = await fetchPage(1);
                let all = first.data as Opportunity[];
                const totalPages = first.meta?.totalPages ?? 1;

                if (totalPages > 1) {
                    const pageRequests = [];
                    for (let page = 2; page <= totalPages; page += 1) {
                        pageRequests.push(fetchPage(page));
                    }
                    const rest = await Promise.all(pageRequests);
                    rest.forEach((result) => {
                        all = all.concat(result.data as Opportunity[]);
                    });
                }

                if (isActive) {
                    setItems(all);
                }
            } catch (error) {
                console.error('Failed to load map data:', error);
                if (isActive) {
                    setItems([]);
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        fetchAll();
        return () => {
            isActive = false;
        };
    }, []);

    const pins = useMemo(() => {
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);

        return items.reduce((acc, item) => {
            if (item.type === 'MARKET' && !isMarketOnDate(item, selected)) return acc;
            if (item.type === 'CONSIGNMENT' && !isConsignmentOnDate(item, selected)) return acc;

            const lat = Number(item.latitude);
            const lng = Number(item.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return acc;

            acc.push({
                id: item.id,
                lat,
                lng,
                type: item.type,
                title: item.title
            });

            return acc;
        }, [] as Array<{ id: string; lat: number; lng: number; type: 'MARKET' | 'CONSIGNMENT'; title: string }>);
    }, [items, selectedDate]);

    const handleSelectOpportunity = (id: string | number) => {
        const selected = items.find((item) => item.id === id);
        if (selected) {
            setSelectedOpportunity(selected);
        }
    };

    return (
        <div className="relative w-full h-[100dvh] bg-[#1a1a1a] flex flex-col pt-32 md:pt-36">
            {/* Map visual placeholder */}
            <div className="absolute inset-0 z-0">
                <MapWithNoSSR pins={pins} filterType={filterType} onSelect={handleSelectOpportunity} />
            </div>

            {/* Controls Overlay */}
            <div className="relative z-10 flex flex-col items-center pt-2 pointer-events-none">
                {/* Floating Glass Bar */}
                <div className="pointer-events-auto flex items-center gap-3 bg-[#1e1e1e]/90 backdrop-blur-md rounded-full pl-4 pr-1.5 py-1.5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

                    {/* Date Selector */}
                    <div className="">
                        <MapDateSelector onDateSelect={setSelectedDate} />
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-white/10" />

                    {/* Type Toggle */}
                    <MapFilterToggle type={filterType} onChange={setFilterType} />
                </div>
            </div>

            {/* Bottom Sheet Placeholder for specific location details */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
                <div className="text-white/40 text-center text-sm">
                    {isLoading ? 'Loading map data...' : 'Select a date and location to view details'}
                </div>
            </div>

            {selectedOpportunity && (
                <OpportunityDetail
                    data={selectedOpportunity}
                    onClose={() => setSelectedOpportunity(null)}
                />
            )}
        </div>
    );
};

export default MapContainer;
