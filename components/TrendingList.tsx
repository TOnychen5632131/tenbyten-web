'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Flame, Star, TrendingUp } from 'lucide-react';

interface TrendingListProps {
    onSelect: (item: any) => void;
    onBack: () => void;
}

// Sub-component to handle individual item logic (ratings, fetching, etc.)
const TrendingItem = ({ item, index, onSelect }: { item: any, index: number, onSelect: (item: any) => void }) => {
    const [rating, setRating] = useState<number | null>(item.google_rating || null);
    const [reviewCount, setReviewCount] = useState<number | null>(item.google_user_ratings_total || null);

    useEffect(() => {
        // If we don't have a rating, fetch it (background)
        // This endpoint will fetch from Google and update the DB so next time it's cached.
        if (!rating && item.id) {
            fetch(`/api/reviews?opportunity_id=${item.id}&limit=1`) // limit=1 explicitly to avoid heavy payload if we just want stats
                .then(res => res.json())
                .then(data => {
                    if (data.stats) {
                        setRating(data.stats.rating);
                        setReviewCount(data.stats.count);
                    }
                })
                .catch(err => console.error('Failed to fetch rating for', item.title, err));
        }
    }, [item.id, rating]);

    return (
        <div
            onClick={() => onSelect(item)}
            className="group relative w-full cursor-pointer hover:scale-[1.02] transition-transform duration-300"
        >
            {/* Ranking Number (Background) */}
            <span className="absolute -left-4 -top-6 text-[120px] font-black text-white/5 select-none pointer-events-none z-0 leading-none italic">
                {index + 1}
            </span>

            {/* Card Body */}
            <div className="relative z-10 bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden">
                {/* Glowing Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            {/* Badges */}
                            <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-900/40 flex items-center gap-1">
                                <Flame size={12} fill="currentColor" />
                                Hot
                            </span>
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/70">
                                {item.type}
                            </span>
                        </div>

                        {/* Title - Reduced Size from text-2xl/3xl to text-xl/2xl */}
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors">
                            {item.title}
                        </h2>

                        <p className="text-white/60 text-sm line-clamp-2 md:w-[90%]">
                            {item.description}
                        </p>

                        {/* Stats Row */}
                        <div className="flex items-center gap-6 mt-4 text-xs font-mono text-white/40">
                            <span className="flex items-center gap-1.5">
                                <TrendingUp size={14} className="text-green-500" />
                                High Demand
                            </span>

                            {/* Rating Display */}
                            {rating ? (
                                <span className="flex items-center gap-1.5 text-white/80">
                                    <Star size={14} className="text-yellow-500" fill="currentColor" />
                                    {rating.toFixed(1)}/5.0
                                    {reviewCount ? <span className="text-white/30">({reviewCount})</span> : null}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-white/30">
                                    <Star size={14} />
                                    No Ratings
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Arrow */}
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center transform group-hover:rotate-[-45deg] transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <ArrowRight size={20} strokeWidth={2.5} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const TrendingList = ({ onSelect, onBack }: TrendingListProps) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch opportunities
        const fetchTrending = async () => {
            try {
                const res = await fetch('/api/opportunities?page=1&limit=50');
                const json = await res.json();
                const data = Array.isArray(json) ? json : json.data;
                // STRICT MODE: Only show items that are actually marked as trending in Admin
                const trending = data.filter((item: any) => item.is_trending);
                setItems(trending);
            } catch (error) {
                console.error('Failed to load trending items', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrending();
    }, []);

    return (
        <div className="w-full min-h-full bg-black text-white pt-40 pb-10 px-4 md:px-0">
            {/* Header */}
            <div className="max-w-3xl mx-auto mb-12">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="group p-4 bg-white/5 rounded-full hover:bg-white/10 transition-all border border-white/5 hover:border-white/20 active:scale-95"
                        aria-label="Go Back"
                    >
                        <ArrowLeft size={24} className="text-white/70 group-hover:text-white transition-colors" />
                    </button>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-gradient-xy">
                            TRENDING
                        </h1>
                        <p className="text-white/50 font-medium tracking-wide mt-1">
                            Curated collection of the hottest markets right now.
                        </p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white/5 rounded-3xl" />)}
                    </div>
                ) : items.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Flame size={48} className="text-white/20" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Trending Markets Yet</h3>
                        <p className="text-white/40 max-w-sm">
                            Check back later for our curated selection of hot upcoming markets.
                        </p>
                    </div>
                ) : (
                    items.map((item, index) => (
                        <TrendingItem
                            key={item.id}
                            item={item}
                            index={index}
                            onSelect={onSelect}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default TrendingList;
