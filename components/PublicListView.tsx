'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, ArrowUpRight, ChevronDown } from 'lucide-react';

interface PublicListViewProps {
    onSelect: (item: any) => void;
}

const PublicListView = ({ onSelect }: PublicListViewProps) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [year, setYear] = useState(2026); // Default to 2026
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const initialLoadRef = useRef(true);

    const [loadingStage, setLoadingStage] = useState(0);
    const loadingMessages = [
        "INITIALIZING NEURAL LINK...",
        "ACCESSING SATELLITE IMAGERY...",
        "ANALYZING MARKET PATTERNS...",
        "SYNTHESIZING OPPORTUNITIES..."
    ];

    useEffect(() => {
        const fetchItems = async () => {
            const isInitialLoad = initialLoadRef.current;
            if (isInitialLoad) {
                setLoading(true);
            }
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: itemsPerPage.toString(),
                    year: year.toString() // Pass year param
                });
                const fetchPromise = fetch(`/api/opportunities?${params.toString()}`);
                const res = isInitialLoad
                    ? (await Promise.all([
                        fetchPromise,
                        new Promise(resolve => setTimeout(resolve, 3000))
                    ]))[0]
                    : await fetchPromise;
                const responseData = await res.json();
                if (responseData?.error) {
                    throw new Error(responseData.error);
                }
                const nextItems = Array.isArray(responseData)
                    ? responseData
                    : Array.isArray(responseData?.data)
                        ? responseData.data
                        : [];
                setItems(nextItems);

                const nextTotalPages = Array.isArray(responseData)
                    ? Math.ceil(nextItems.length / itemsPerPage)
                    : responseData.meta?.totalPages ?? Math.ceil(nextItems.length / itemsPerPage);
                setTotalPages(nextTotalPages);

                const nextTotalItems = Array.isArray(responseData)
                    ? nextItems.length
                    : responseData.meta?.total ?? nextItems.length;
                setTotalItems(nextTotalItems);
            } catch (error) {
                console.error("Failed to fetch opportunities:", error);
                setItems([]);
                setTotalPages(0);
                setTotalItems(0);
            } finally {
                if (isInitialLoad) {
                    setLoading(false);
                    initialLoadRef.current = false;
                }
            }
        };
        fetchItems();
    }, [page, itemsPerPage, year]); // Add year dependency

    // Loading text cycle
    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setLoadingStage(prev => (prev + 1) % loadingMessages.length);
            }, 750);
            return () => clearInterval(interval);
        }
    }, [loading]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const displayTotal = totalItems + 200;

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
                <div className="relative">
                    {/* Pulsing Core */}
                    <div className="w-24 h-24 rounded-full bg-blue-500/20 animate-pulse flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                        <div className="w-16 h-16 rounded-full bg-blue-400/20 flex items-center justify-center animate-spin-slow">
                            <div className="w-12 h-12 rounded-full border-2 border-t-blue-400 border-r-transparent border-b-blue-400 border-l-transparent animate-spin" />
                        </div>
                    </div>
                    {/* Scanning Circles */}
                    <div className="absolute inset-0 w-24 h-24 rounded-full border border-blue-500/30 animate-ping opacity-20" />
                </div>

                <div className="mt-8 text-center space-y-2">
                    <div className="text-blue-400 font-mono text-xs tracking-[0.2em] animate-pulse">
                        {loadingMessages[loadingStage]}
                    </div>
                    <div className="flex gap-1 justify-center mt-2">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="w-1 h-1 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-[100dvh] pt-32 pb-32 px-4 md:px-0 flex flex-col items-center bg-black">
            <div className="w-full max-w-2xl">

                <div className="flex justify-between items-end mb-6 mt-8 pl-2">
                    <div className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
                        Found {displayTotal} opportunities in {year}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsYearOpen(!isYearOpen)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all backdrop-blur-md"
                        >
                            <span className="opacity-50 text-[10px] uppercase mr-1">Year</span>
                            {year}
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isYearOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isYearOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsYearOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                    {[2026, 2025].map((y) => (
                                        <button
                                            key={y}
                                            onClick={() => {
                                                setYear(y);
                                                setPage(1);
                                                setIsYearOpen(false);
                                            }}
                                            className={`px-4 py-3 text-left text-xs font-medium hover:bg-white/5 transition-colors flex justify-between items-center ${year === y ? 'text-white bg-white/5' : 'text-white/50'
                                                }`}
                                        >
                                            {y}
                                            {year === y && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="group relative w-full p-[1px] rounded-3xl overflow-hidden transition-all duration-300 active:scale-[0.98] cursor-pointer"
                        >
                            {/* Glowing Border Gradient */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${item.type === 'MARKET' ? 'from-blue-500 via-blue-400 to-blue-500' : 'from-emerald-500 via-teal-500 to-emerald-500'}`} />

                            {/* Glass Card Content */}
                            <div className="relative h-full bg-white/5 backdrop-blur-2xl rounded-[23px] p-5 border border-white/10 flex flex-col gap-3 group-hover:bg-white/10 transition-colors">
                                {/* Header Row */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-white tracking-tight">{item.title}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {/* Type Badge */}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${item.type === 'MARKET' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                                                {item.type}
                                            </span>

                                            {/* Date Badge */}
                                            {(() => {
                                                const getNextOccurrence = (data: any) => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);

                                                    if (!data.season_start_date && !data.start_date) return null;

                                                    const startStr = data.season_start_date || data.start_date;
                                                    const start = new Date(startStr + 'T00:00:00');
                                                    const end = data.season_end_date ? new Date(data.season_end_date + 'T00:00:00') : new Date('2030-01-01');

                                                    if (today > end) return null;

                                                    const searchStart = today < start ? start : today;

                                                    if (!data.recurring_pattern) {
                                                        return start >= today ? start : (today <= end ? today : null);
                                                    }

                                                    const pattern = data.recurring_pattern;

                                                    // Weekly
                                                    if (pattern.includes('Weekly')) {
                                                        const daysMap: Record<string, number> = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
                                                        const daysStr = pattern.replace('Weekly on ', '');
                                                        const days = daysStr.split(', ').map((d: string) => daysMap[d]);

                                                        for (let i = 0; i < 7; i++) {
                                                            const checkDate = new Date(searchStart);
                                                            checkDate.setDate(searchStart.getDate() + i);
                                                            if (checkDate > end) return null;
                                                            if (days.includes(checkDate.getDay())) return checkDate;
                                                        }
                                                    }

                                                    // Monthly (simplified fallback for list view if complex)
                                                    if (pattern.includes('Monthly')) {
                                                        // Fallback to simply showing "Next: Check details" or try to calc
                                                        // Let's copy the full logic to be safe and accurate
                                                        const parts = pattern.split(' ');
                                                        if (parts.length >= 5) {
                                                            const ordinalStr = parts[3];
                                                            const dayStr = parts[4];
                                                            const daysMap: Record<string, number> = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
                                                            const targetDay = daysMap[dayStr];

                                                            for (let i = 0; i < 6; i++) { // Check next 6 months
                                                                const currentMonth = new Date(searchStart.getFullYear(), searchStart.getMonth() + i, 1);
                                                                let date = new Date(currentMonth);
                                                                while (date.getDay() !== targetDay) date.setDate(date.getDate() + 1);

                                                                if (ordinalStr === '2nd') date.setDate(date.getDate() + 7);
                                                                if (ordinalStr === '3rd') date.setDate(date.getDate() + 14);
                                                                if (ordinalStr === '4th') date.setDate(date.getDate() + 21);
                                                                if (ordinalStr === 'Last') {
                                                                    const nextMonthFn = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                                                                    let lastDate = new Date(nextMonthFn);
                                                                    while (lastDate.getDay() !== targetDay) lastDate.setDate(lastDate.getDate() - 1);
                                                                    date = lastDate;
                                                                }
                                                                if (date >= searchStart && date <= end) return date;
                                                            }
                                                        }
                                                    }

                                                    // Fallback check if simple date match
                                                    return start >= today ? start : (today <= end ? today : null);
                                                };

                                                const nextDate = getNextOccurrence(item);
                                                if (!nextDate) return null;

                                                return (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/80 border border-white/10 flex items-center gap-1">
                                                        Next: {nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                );
                                            })()}

                                            {/* Rating Badge */}
                                            {Number.isFinite(Number(item.google_rating)) && (
                                                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold">
                                                    <Star size={10} fill="currentColor" /> {Number(item.google_rating).toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                                        <ArrowUpRight size={18} className="text-white/70" />
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-white/60 text-sm leading-relaxed line-clamp-2">
                                    {item.description || "No description available for this market opportunity."}
                                </p>

                                {/* Tags */}
                                {item.tags && item.tags.length > 0 && (
                                    <div className="flex gap-2 mt-1 overflow-hidden">
                                        {item.tags.slice(0, 3).map((tag: string, i: number) => (
                                            <span key={i} className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 whitespace-nowrap">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12 flex justify-center items-center gap-4 select-none">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors backdrop-blur-md"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex gap-2">
                            {(() => {
                                const visiblePages = [];
                                const delta = 1; // Number of pages to show on each side of current page

                                if (totalPages <= 7) {
                                    // If detailed total pages are small, show all
                                    for (let i = 1; i <= totalPages; i++) {
                                        visiblePages.push(i);
                                    }
                                } else {
                                    // Always show first page
                                    visiblePages.push(1);

                                    // Calculate range around current page
                                    let start = Math.max(2, page - delta);
                                    let end = Math.min(totalPages - 1, page + delta);

                                    // Adjust range if close to ends
                                    if (page <= 3) {
                                        end = 4;
                                        start = 2;
                                    }
                                    if (page >= totalPages - 2) {
                                        start = totalPages - 3;
                                        end = totalPages - 1;
                                    }

                                    // Add left ellipsis
                                    if (start > 2) {
                                        visiblePages.push(-1); // -1 represents ellipsis
                                    }

                                    // Add middle pages
                                    for (let i = start; i <= end; i++) {
                                        visiblePages.push(i);
                                    }

                                    // Add right ellipsis
                                    if (end < totalPages - 1) {
                                        visiblePages.push(-1); // -1 represents ellipsis
                                    }

                                    // Always show last page
                                    visiblePages.push(totalPages);
                                }

                                return visiblePages.map((pageNum, idx) => (
                                    pageNum === -1 ? (
                                        <div key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-white/50">
                                            ...
                                        </div>
                                    ) : (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all border ${page === pageNum
                                                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110'
                                                : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                ));
                            })()}
                        </div>

                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors backdrop-blur-md"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-16 text-center relative z-10 pointer-events-auto">
                    <div className="text-white/20 text-[10px] uppercase tracking-[0.2em]">
                        <span>TENBYTEN.VERCEL.APP</span>
                        <span className="mx-2">/</span>
                        <a
                            href="/about"
                            className="text-white/40 underline decoration-white/20 underline-offset-4 hover:text-white/70 hover:decoration-white/60 transition-colors"
                        >
                            About & Partnerships
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PublicListView;
