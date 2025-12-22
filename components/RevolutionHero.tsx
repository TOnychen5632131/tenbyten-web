'use client';
import React, { useState } from 'react';
import { Search, X, Mic, Camera, ArrowLeft, ArrowRight } from 'lucide-react';
import SegmentedNav from './SegmentedNav';
import MapContainer from './MapContainer';
import OpportunityDetail from './OpportunityDetail';

const RevolutionHero = () => {
    const [activeTab, setActiveTab] = useState('search');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedResult, setSelectedResult] = useState<any>(null);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    const searchPlaceholders = [
        "Find a vintage market open on Sunday",
        "Beginner-friendly indoor booths",
        "High foot traffic malls near me",
        "Suggest a pop-up spot for next week",
        "Where can I sell handmade jewelry?"
    ];

    // Placeholder Carousel Effect
    React.useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Debounced search effect
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 1) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    if (data.success) {
                        setResults(data.results || []);
                    }
                } catch (e) {
                    console.error('Search failed', e);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Clear search helper
    const handleClear = () => {
        setQuery('');
        setResults([]);
    };

    return (
        // Use 100dvh for better mobile browser support (address bar handling)
        <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-black">
            {/* Navigation Wrapper - Absolute to avoid flex centering */}
            {!selectedResult && (
                <div className="absolute top-0 left-0 right-0 z-[100]">
                    <SegmentedNav activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
            )}

            {/* SEARCH VIEW */}
            {activeTab === 'search' && (
                <>
                    {/* Background Video */}
                    <div className="absolute inset-0 z-0 animate-fade-in">
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        >
                            <source src="/bg-revolution.mp4" type="video/mp4" />
                        </video>
                        {/* Dark overlay for contrast */}
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Content */}
                    <div className={`relative z-10 w-full px-4 md:px-6 flex flex-col items-center transition-all duration-500 ${results.length > 0 ? 'pt-44 justify-start h-full' : 'justify-center h-full'}`}>
                        {/* Title - fades out when searching to make room */}
                        {results.length === 0 && (
                            <h1 className="text-[13vw] md:text-9xl font-bold text-white mb-6 tracking-tighter drop-shadow-2xl text-center select-none font-sans leading-tight animate-scale-up">
                                Tenbyten
                            </h1>
                        )}

                        {/* Search Bar Container - Transitions from Center to Top */}
                        <div className={`w-full max-w-2xl flex items-center gap-3 transition-all duration-500 z-50 ${results.length > 0 ? 'mb-4' : 'mb-8'}`}>
                            {/* Back Button (Only visible when results exist) */}
                            {results.length > 0 && (
                                <button
                                    onClick={handleClear}
                                    className="p-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/20 active:scale-95 transition-all animate-fade-in"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            )}

                            {/* Main Search Input */}
                            <div className="flex-1 bg-white rounded-full flex items-center px-4 md:px-5 py-3 md:py-3.5 shadow-2xl transform transition-all duration-300">
                                {/* AI Green Orb Icon */}
                                {/* AI Green Orb Icon */}
                                <div className={`relative w-8 h-8 rounded-full bg-gradient-to-b from-[#8beca8] to-[#15803d] shadow-[inset_0_0_10px_rgba(255,255,255,0.6),0_4px_10px_rgba(22,101,52,0.4)] mr-2 flex-shrink-0 transition-transform duration-700 ${isSearching ? 'animate-pulse scale-110' : ''}`}>
                                    {/* High Gloss Specular Highlight */}
                                    <div className="absolute top-[10%] left-[15%] w-[40%] h-[25%] bg-gradient-to-b from-white to-transparent rounded-full opacity-90 blur-[1px]" />
                                    {/* Bottom Reflection */}
                                    <div className="absolute bottom-[5%] left-[20%] w-[60%] h-[20%] bg-gradient-to-t from-[#4ade80] to-transparent rounded-full opacity-60 blur-[2px]" />
                                </div>
                                <div className="relative flex-1 h-full flex items-center overflow-hidden">
                                    {/* Animated Placeholder */}
                                    {!query && (
                                        <div className="absolute inset-0 flex items-center">
                                            <span
                                                key={placeholderIndex}
                                                className="animate-slide-up-fade text-[#C4C3C5] text-base md:text-lg truncate font-normal pointer-events-none"
                                            >
                                                {searchPlaceholders[placeholderIndex]}
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="w-full h-full bg-transparent border-none outline-none text-black text-base md:text-lg px-0 truncate font-normal relative z-10"
                                        spellCheck={false}
                                    />
                                </div>
                                {query && (
                                    <X
                                        className="text-gray-400 w-5 h-5 cursor-pointer hover:text-gray-600 transition-colors mr-2"
                                        onClick={handleClear}
                                    />
                                )}
                                <button className="ml-2 px-4 py-1.5 bg-[#4285f4] text-white rounded-full text-sm font-semibold hover:bg-[#3367d6] transition-colors shadow-md">
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Search Results Grid - iOS 26 Glass Style */}
                        {results.length > 0 && (
                            <div className="w-full max-w-2xl animate-slide-up pb-32 h-full overflow-y-auto no-scrollbar">
                                <div className="grid grid-cols-1 gap-4">
                                    {results.map((item: any) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedResult(item)}
                                            className="group relative w-full p-[1px] rounded-3xl overflow-hidden transition-all duration-300 active:scale-[0.98] cursor-pointer"
                                        >
                                            {/* Glowing Border Gradient */}
                                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${item.type === 'MARKET' ? 'from-blue-500 via-blue-400 to-blue-500' : 'from-emerald-500 via-teal-500 to-emerald-500'}`} />

                                            {/* Glass Card Content */}
                                            <div className="relative h-full bg-black/40 backdrop-blur-3xl rounded-[23px] p-5 border border-white/10 flex flex-col gap-3">
                                                {/* Header Row */}
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white tracking-tight">{item.title}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${item.type === 'MARKET' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                                                                {item.type}
                                                            </span>
                                                            <span className="text-white/40 text-xs flex items-center gap-1">
                                                                {(item.similarity * 100).toFixed(0)}% Match
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                        <ArrowRight size={16} className="text-white/50 -rotate-45" />
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-white/70 text-sm leading-relaxed line-clamp-2">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Detail Modal Integration */}
                        {selectedResult && (
                            <OpportunityDetail
                                data={selectedResult}
                                onClose={() => setSelectedResult(null)}
                            />
                        )}

                        {/* Buttons (Hidden when searching) */}
                        {results.length === 0 && (
                            <div className="flex flex-wrap justify-center gap-3 md:gap-4 w-full px-2">
                                <button className="px-6 py-3 md:py-2.5 rounded-full border border-white/60 bg-white/10 text-white text-sm md:text-base font-medium hover:bg-white/20 active:bg-white/30 transition-all backdrop-blur-sm whitespace-nowrap active:scale-95 shadow-lg">
                                    Nearby Sales
                                </button>
                                <button className="px-6 py-3 md:py-2.5 rounded-full border border-white/60 bg-white/10 text-white text-sm md:text-base font-medium hover:bg-white/20 active:bg-white/30 transition-all backdrop-blur-sm whitespace-nowrap active:scale-95 shadow-lg">
                                    Digital Card
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer Text */}
                    <div className="absolute bottom-6 md:bottom-6 text-white/40 text-[10px] md:text-[10px] text-center px-6 w-full uppercase tracking-widest font-medium leading-relaxed">
                        www.tenbyten.com rights reserved by tenbyten
                    </div>
                </>
            )}

            {/* MAP VIEW */}
            {activeTab === 'map' && (
                <div className="absolute inset-0 z-[40] bg-black animate-fade-in">
                    <MapContainer />
                </div>
            )}
        </div>
    );
};

export default RevolutionHero;
