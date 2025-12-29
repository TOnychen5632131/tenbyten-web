'use client';
import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, ExternalLink, User, Users, ChevronLeft, ShieldCheck, Star, MessageSquare, Clock } from 'lucide-react';

interface OpportunityDetailProps {
    data: any;
    onClose: () => void;
}

const OpportunityDetail = ({ data, onClose }: OpportunityDetailProps) => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [stats, setStats] = useState<{ rating: number | null, count: number | null }>({ rating: null, count: null });
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            setLoadingReviews(true);
            try {
                const res = await fetch(`/api/reviews?opportunity_id=${data.id}`);
                const json = await res.json();
                if (json.reviews) {
                    setReviews(json.reviews);
                }
                if (json.stats) {
                    setStats(json.stats);
                }
            } catch (err) {
                console.error("Failed to load reviews", err);
            } finally {
                setLoadingReviews(false);
            }
        };

        if (data?.id) fetchReviews();
    }, [data.id]);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Helper to calculate next occurrence
    const getNextOccurrence = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!data.season_start_date) return null;

        const start = new Date(data.season_start_date + 'T00:00:00');
        const end = data.season_end_date ? new Date(data.season_end_date + 'T00:00:00') : new Date('2030-01-01');

        if (today > end) return null;

        // Start searching from today or start date, whichever is later
        let searchStart = today < start ? start : today;

        if (!data.recurring_pattern) {
            return start >= today ? start : (today <= end ? today : null);
        }

        const pattern = data.recurring_pattern;

        // Weekly
        if (pattern.includes('Weekly')) {
            const daysMap: Record<string, number> = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
            const daysStr = pattern.replace('Weekly on ', '');
            const days = daysStr.split(', ').map((d: string) => daysMap[d]);

            // Look ahead 7 days from searchStart
            for (let i = 0; i < 7; i++) {
                const checkDate = new Date(searchStart);
                checkDate.setDate(searchStart.getDate() + i);

                if (checkDate > end) return null;
                if (days.includes(checkDate.getDay())) {
                    return checkDate;
                }
            }
        }

        // Monthly
        if (pattern.includes('Monthly')) {
            const parts = pattern.split(' '); // ["Monthly", "on", "the", "3rd", "Saturday"]
            const ordinalStr = parts[3];
            const dayStr = parts[4];

            const daysMap: Record<string, number> = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
            const targetDay = daysMap[dayStr];

            // Check upcoming months (up to 12) from searchStart
            for (let i = 0; i < 12; i++) {
                const currentMonth = new Date(searchStart.getFullYear(), searchStart.getMonth() + i, 1);

                let date = new Date(currentMonth);
                while (date.getDay() !== targetDay) {
                    date.setDate(date.getDate() + 1);
                }

                if (ordinalStr === '2nd') date.setDate(date.getDate() + 7);
                if (ordinalStr === '3rd') date.setDate(date.getDate() + 14);
                if (ordinalStr === '4th') date.setDate(date.getDate() + 21);
                if (ordinalStr === 'Last') {
                    const nextMonthFn = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    let lastDate = new Date(nextMonthFn);
                    while (lastDate.getDay() !== targetDay) {
                        lastDate.setDate(lastDate.getDate() - 1);
                    }
                    date = lastDate;
                }

                if (date >= searchStart && date <= end) {
                    return date;
                }
            }
        }

        return null;
    };

    const nextDate = getNextOccurrence();

    if (!data || !mounted) return null;

    const content = (
        <div className="fixed inset-0 z-[10002] flex flex-col items-center justify-end md:justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="absolute inset-0" onClick={onClose} />

            {/* Main Wrapper to handle button positioning */}
            <div className="relative w-full max-w-md h-[95dvh] md:h-auto md:max-h-[85vh] animate-slide-up flex flex-col md:overflow-visible">

                {/* Back/Close Button */}
                <button
                    onClick={onClose}
                    className="absolute z-50 p-2 rounded-full bg-black/20 text-white backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all active:scale-95 top-4 left-4 md:top-0 md:-left-20"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Card Content */}
                <div className="relative w-full h-full bg-[#1e1e1e]/60 backdrop-blur-[50px] border border-white/10 rounded-t-[30px] md:rounded-[40px] overflow-hidden shadow-2xl flex flex-col">
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar pb-32 pt-16 md:pt-6">

                        {/* Header: Title & Counter */}
                        <div className="flex justify-between items-start mb-6 pt-2">
                            <div className="flex-1 pr-4">
                                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">
                                    {data.title}
                                </h2>
                                <p className="text-white/60 text-sm mt-1 uppercase tracking-wider font-medium">
                                    {data.type === 'MARKET' ? 'Offline Event' : 'Consignment Shop'}
                                </p>
                            </div>
                            {/* Circular Counter - Google Ratings */}
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg relative group overflow-hidden">
                                {stats.rating ? (
                                    <div className="text-center leading-none">
                                        <span className="block text-black font-bold text-lg">{stats.rating.toFixed(1)}</span>
                                        <span className="block text-black/40 text-[10px] font-medium leading-none mt-0.5">{(stats.count || 0) > 1000 ? ((stats.count || 0) / 1000).toFixed(1) + 'k' : (stats.count || 0)}</span>
                                    </div>
                                ) : (
                                    <div className="text-center leading-none">
                                        <span className="block text-black font-bold text-sm">--</span>
                                        <span className="block text-black/40 text-[10px] font-medium">Rate</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Date/Time Strip */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-white/10 flex flex-col items-center justify-center shrink-0 border border-white/5">
                                <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider">
                                    {nextDate ? nextDate.toLocaleDateString('en-US', { month: 'short' }) : 'END'}
                                </span>
                                <span className="text-xl text-white font-bold leading-none mt-0.5">
                                    {nextDate ? nextDate.getDate() : '--'}
                                </span>
                            </div>
                            <div>
                                <div className="text-white font-medium text-sm">
                                    {data.recurring_pattern ? (
                                        <span className="text-blue-300 font-bold">{data.recurring_pattern}</span>
                                    ) : (
                                        data.season_start_date ? (
                                            new Date(data.season_start_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                                        ) : "See details for schedule"
                                    )}
                                </div>

                                {(data.season_start_date || data.season_end_date) && (
                                    <div className="text-white/50 text-xs mt-0.5">
                                        Season: {data.season_start_date ? new Date(data.season_start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                        {data.season_end_date ? ` - ${new Date(data.season_end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                                    </div>
                                )}

                                <div className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                                    <Calendar size={12} />
                                    {data.start_time ? data.start_time.slice(0, 5) : ''}
                                    {data.start_time && data.end_time ? ' - ' : ''}
                                    {data.end_time ? data.end_time.slice(0, 5) : ''}
                                </div>
                            </div>
                        </div>

                        {/* Vendor Application Window - High Priority */}
                        {(data.application_start_date || data.application_end_date) && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-4 flex items-center gap-3 animate-pulse-slow">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <Calendar size={20} className="text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-0.5">Vendor Application Window</div>
                                    <div className="text-emerald-100 text-sm font-medium">
                                        {data.application_start_date ? new Date(data.application_start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Now'}
                                        {' - '}
                                        {data.application_end_date ? new Date(data.application_end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Until Full'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Advanced Schedule (Seasonal / Exceptions) */}
                        {data.additional_schedules && data.additional_schedules.length > 0 && (
                            <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in-up delay-100">
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <Clock size={16} className="text-orange-400" />
                                    Seasonal Hours & Exceptions
                                </h3>
                                <div className="space-y-3">
                                    {data.additional_schedules.map((schedule: any, idx: number) => (
                                        <div key={idx} className="text-sm border-l-2 border-white/10 pl-3">
                                            {schedule.label && <div className="font-bold text-white/90">{schedule.label}</div>}
                                            <div className="text-white/60 text-xs mt-1">
                                                {schedule.start_date ? new Date(schedule.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                                {schedule.end_date ? ` - ${new Date(schedule.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                                            </div>
                                            <div className="text-white/60 text-xs">
                                                {schedule.days?.join(', ')} • {schedule.start_time} - {schedule.end_time}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews Section */}
                        <div className="mb-10">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Star className="text-yellow-400 fill-yellow-400" size={24} />
                                Reviews
                                {loadingReviews && <span className="text-xs font-normal text-white/40 ml-2 animate-pulse">(Loading from Google...)</span>}
                            </h3>

                            {!loadingReviews && reviews.length === 0 && (
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-white/40">
                                    No reviews found yet.
                                </div>
                            )}

                            <div className="space-y-4">
                                {reviews.map((review, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3 mb-2">
                                            {review.author_photo_url ? (
                                                <img src={review.author_photo_url} alt={review.author_name} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                    <User size={14} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-bold text-white">{review.author_name}</div>
                                                <div className="flex items-center gap-1">
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={10}
                                                                className={i < review.rating ? "fill-current" : "text-white/20"}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-white/40 ml-2">{review.original_date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-white/80 leading-relaxed font-light">
                                            "{review.text}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-2 flex gap-3 mb-6">
                            <div className="w-24 h-24 rounded-2xl bg-gray-700 relative overflow-hidden shrink-0">
                                <div className="absolute inset-0 opacity-50 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/0,0,10,0/300x300?access_token=pk.eyJ1IjoidGVhY2hlcmZ1bmciLCJhIjoiY2x0ZzJzN29vMDBtNDJrbzB5dG9uYTN2biJ9.awC8u4b-fI4q4lY-w9J4Ig')] bg-cover bg-center"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <MapPin size={24} className="text-white drop-shadow-md" fill="currentColor" />
                                </div>
                            </div>
                            <div className="flex-1 py-1 pr-2 flex flex-col justify-center">
                                <div className="text-white text-sm font-medium leading-tight mb-2">
                                    {data.address || "Location pending"}
                                </div>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.address || '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="self-start flex items-center gap-1 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors"
                                >
                                    <ExternalLink size={12} />
                                    Get Direction
                                </a>
                            </div>
                        </div>

                        {/* Hosted By */}
                        <div className="space-y-3 mb-8">
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex justify-between items-center">
                                <span className="text-white/60 text-sm pl-1">Hosted By</span>
                                <div className="flex items-center gap-2 bg-black/20 rounded-full pl-1 pr-3 py-1">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <User size={14} className="text-blue-200" />
                                    </div>
                                    <span className="text-white text-xs font-medium truncate max-w-[150px]">
                                        {data.organizer_name || "Tenbyten Host"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* About Event */}
                        <div className="mb-6">
                            <h3 className="text-white font-bold text-lg mb-2">About Event</h3>
                            <p className="text-white/60 text-sm leading-relaxed font-light whitespace-pre-wrap">
                                {data.description || "No description provided."}
                            </p>
                        </div>

                        {/* Features / Insights */}
                        {
                            (data.tags?.length > 0 || data.categories?.length > 0) && (
                                <div className="mb-24 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                    <div className="flex items-center gap-2 mb-4">
                                        <ShieldCheck className="text-blue-400" size={20} />
                                        <h3 className="text-white font-bold text-lg">Market Features</h3>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {data.categories?.map((cat: string, i: number) => (
                                            <span key={`cat-${i}`} className="text-[10px] px-2 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md">
                                                {cat}
                                            </span>
                                        ))}
                                        {data.tags?.map((tag: string, i: number) => (
                                            <span key={`tag-${i}`} className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {data.vendor_count && (
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-white/50 text-xs">
                                            <Users size={14} />
                                            <span>Approx. {data.vendor_count} Vendors</span>
                                        </div>
                                    )}
                                </div>
                            )
                        }

                    </div>

                    {/* Bottom Action Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 md:p-6 bg-gradient-to-t from-[#1e1e1e] from-60% via-[#1e1e1e]/80 to-transparent pointer-events-none flex justify-center">
                        <button
                            onClick={() => {
                                const targetUrl = data.application_link || data.website;
                                if (targetUrl) {
                                    window.open(targetUrl, '_blank');
                                } else {
                                    window.open(`https://www.google.com/search?q=${encodeURIComponent(data.title + " booth application")}`, '_blank');
                                }
                            }}
                            className="pointer-events-auto w-full bg-white text-black font-bold text-lg py-4 rounded-full shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <ExternalLink size={20} />
                            {data.type === 'MARKET' ? 'Apply for Booth' : 'Contact Shop'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const { createPortal } = require('react-dom');
    return createPortal(content, document.body);
};

export default OpportunityDetail;
