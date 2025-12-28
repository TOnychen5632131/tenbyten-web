'use client';
import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, ExternalLink, User, ChevronLeft, ShieldCheck, Star, MessageSquare } from 'lucide-react';

interface OpportunityDetailProps {
    data: any;
    onClose: () => void;
}

const OpportunityDetail = ({ data, onClose }: OpportunityDetailProps) => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            setLoadingReviews(true);
            try {
                const res = await fetch(`/api/reviews?opportunity_id=${data.id}`);
                const json = await res.json();
                if (json.reviews) {
                    setReviews(json.reviews);
                }
            } catch (err) {
                console.error("Failed to load reviews", err);
            } finally {
                setLoadingReviews(false);
            }
        };

        if (data?.id) fetchReviews();
    }, [data.id]);

    if (!data) return null;

    return (
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
                                {/* In reference, there is a square image on left, but we can do text if no image */}
                                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">
                                    {data.title}
                                </h2>
                                <p className="text-white/60 text-sm mt-1 uppercase tracking-wider font-medium">
                                    {data.type === 'MARKET' ? 'Offline Event' : 'Consignment Shop'}
                                </p>
                            </div>
                            {/* Circular Counter (Mock) */}
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg">
                                <div className="text-center leading-none">
                                    <span className="block text-black font-bold text-sm">24</span>
                                    <span className="block text-black/40 text-[10px] font-medium">/ 50</span>
                                </div>
                            </div>
                        </div>

                        {/* Date/Time Strip */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[10px] text-white/60 uppercase font-bold">
                                    {data.season_start_date ? new Date(data.season_start_date).toLocaleDateString('en-US', { month: 'short' }) : 'OPEN'}
                                </span>
                                <span className="text-lg text-white font-bold">
                                    {data.season_start_date ? new Date(data.season_start_date).getDate() : 'NOW'}
                                </span>
                            </div>
                            <div>
                                <div className="text-white font-medium text-sm">
                                    {data.season_start_date ? (
                                        <>
                                            {new Date(data.season_start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                            {data.season_end_date && ` - ${ new Date(data.season_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } `}
                                        </>
                                    ) : (
                                        data.recurring_pattern || "See details for schedule"
                                    )}
                                </div>
                                <div className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                                    <Calendar size={12} />
                                    {data.start_time ? data.start_time.slice(0, 5) : ''}
                                    {data.start_time && data.end_time ? ' - ' : ''}
                                    {data.end_time ? data.end_time.slice(0, 5) : ''}
                                </div>
                            </div>
                        </div>

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
                            {/* Mini Map Preview */}
                            <div className="w-24 h-24 rounded-2xl bg-gray-700 relative overflow-hidden shrink-0">
                                {/* Mock Map Image Style */}
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
target = "_blank"
rel = "noopener noreferrer"
className = "self-start flex items-center gap-1 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors"
    >
    <ExternalLink size={12} />
                                    Get Direction
                                </a >
                            </div >
                        </div >

    {/* Hosted By */ }
    < div className = "space-y-3 mb-8" >
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
                        </div >

    {/* About Event */ }
    < div className = "mb-6" >
                            <h3 className="text-white font-bold text-lg mb-2">About Event</h3>
                            <p className="text-white/60 text-sm leading-relaxed font-light whitespace-pre-wrap">
                                {data.description || "No description provided."}
                            </p>
                        </div >

    {/* Features / Insights */ }
{
    (data.tags?.length > 0 || data.categories?.length > 0) && (
        <div className="mb-24 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 relative overflow-hidden group">
            {/* Decorative Background Gradient */}
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

                    </div >

    {/* Bottom Action Bar */ }
    < div className = "absolute bottom-0 left-0 right-0 p-4 pb-8 md:p-6 bg-gradient-to-t from-[#1e1e1e] from-60% via-[#1e1e1e]/80 to-transparent pointer-events-none flex justify-center" >
        <button
            onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(data.title + " booth application")}`, '_blank')}
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
};

export default OpportunityDetail;
