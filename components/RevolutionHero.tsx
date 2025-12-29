'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Mic, Camera, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import SegmentedNav from './SegmentedNav';
import MapContainer from './MapContainer';
import OpportunityDetail from './OpportunityDetail';
import PublicListView from './PublicListView';
import TrendingList from './TrendingList';
import ProfileGateModal from './ProfileGateModal';

const RevolutionHero = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('search');
    const { user, profile, loading } = useAuth(); // Import useAuth
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // Local state if we want to trigger modal from here, or we can just block activeTab change
    const [isProfileGateOpen, setIsProfileGateOpen] = useState(false);
    const [hasPromptedProfile, setHasPromptedProfile] = useState(false);

    const favoriteMarketCount = Array.isArray(profile?.top_markets)
        ? profile.top_markets.filter((market: string) => String(market).trim() !== '').length
        : 0;
    const hasRequiredMarkets = favoriteMarketCount >= 3;
    const needsProfileAccess = Boolean(user) && !loading && !hasRequiredMarkets;

    React.useEffect(() => {
        if (needsProfileAccess && !hasPromptedProfile) {
            setIsProfileGateOpen(true);
            setHasPromptedProfile(true);
        }
        if (!needsProfileAccess) {
            setIsProfileGateOpen(false);
        }
    }, [needsProfileAccess, hasPromptedProfile]);

    // Intercept tab change
    const handleTabChange = (tab: string) => {
        if ((tab === 'map' || tab === 'list') && !user) {
            // If trying to access protected tabs without auth
            alert("Please login to access Map and List views."); // Simple alert for now, or trigger header modal if possible.
            // Ideally we would open the global auth modal. 
            // Since Header has the modal, we might need a global state or event. 
            // For now, let's just create a local AuthModal instance here or use a simple alert.
            setIsAuthModalOpen(true);
            return;
        }
        if ((tab === 'map' || tab === 'list') && (!hasRequiredMarkets || loading)) {
            if (!loading) {
                setIsProfileGateOpen(true);
            }
            return;
        }
        setActiveTab(tab);
    };
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [searchStatus, setSearchStatus] = useState('');
    const [selectedResult, setSelectedResult] = useState<any>(null);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [titleClickCount, setTitleClickCount] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);
    const [lastSearchedQuery, setLastSearchedQuery] = useState('');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const searchPlaceholders = [
        "Find a vintage market open on Sunday",
        "Beginner-friendly indoor booths",
        "High foot traffic malls near me",
        "Suggest a pop-up spot for next week",
        "Where can I sell handmade jewelry?"
    ];

    const emptyStateSuggestions = [
        { label: "Markets I can join next week", query: "Markets I can join next week" },
        { label: "Vintage markets this weekend", query: "Vintage markets this weekend" },
        { label: "Food truck markets this week", query: "Food truck markets this week" },
        { label: "Community markets near me", query: "Community markets near me" }
    ];

    const NEARBY_RADIUS_KM = 50;
    const needsLocation = (text: string) => /near me|nearby|around me|附近|周边|离我/i.test(text);

    const requestLocation = () =>
        new Promise<{ lat: number; lng: number } | null>((resolve) => {
            if (typeof navigator === 'undefined' || !navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve(null),
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
            );
        });

    // Placeholder Carousel Effect
    React.useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Simulated Progress Logic
    const runSearchSimulation = async () => {
        setIsSearching(true);
        setResults([]); // Clear previous results immediately
        setProgress(0);

        const stages = [
            { pct: 10, msg: "Encrypting Query..." },
            { pct: 30, msg: "AI Semantic Analysis..." },
            { pct: 60, msg: "Scanning Vector Database..." },
            { pct: 85, msg: "Filtering & Ranking..." },
            { pct: 95, msg: "Finalizing..." }
        ];

        for (const stage of stages) {
            setSearchStatus(stage.msg);
            setProgress(stage.pct);
            // Random delay between steps to feel "organic"
            // Adjusted to ~3s total (avg 600ms * 5 stages)
            await new Promise(r => setTimeout(r, Math.random() * 400 + 400));
        }
    };

    // Manual Search Handler
    const handleSearch = async (overrideQuery?: string) => {
        const queryToUse = (typeof overrideQuery === 'string' ? overrideQuery : query).trim();
        if (typeof overrideQuery === 'string') {
            setQuery(overrideQuery);
        }
        if (!queryToUse) {
            setResults([]);
            setIsSearching(false);
            setHasSearched(false);
            setLastSearchedQuery('');
            setProgress(0);
            setLocationError(null);
            return;
        }

        setHasSearched(true);
        setLastSearchedQuery(queryToUse);
        setIsSearching(true);
        setResults([]); // Clear previous results immediately
        setProgress(0);
        setLocationError(null);

        let coords = userLocation;
        if (needsLocation(queryToUse) && !coords) {
            setSearchStatus("Requesting location access...");
            coords = await requestLocation();
            if (!coords) {
                setIsSearching(false);
                setLocationError("Location access is required to show nearby results.");
                return;
            }
            setUserLocation(coords);
        }

        // Start simulation and fetch in parallel
        const simulationPromise = runSearchSimulation();

        // Actual Fetch
        const fetchPromise = (async () => {
            try {
                const params = new URLSearchParams({ q: queryToUse });
                if (coords) {
                    params.set('lat', coords.lat.toString());
                    params.set('lng', coords.lng.toString());
                    params.set('radius_km', NEARBY_RADIUS_KM.toString());
                }
                const res = await fetch(`/api/search?${params.toString()}`);
                const data = await res.json();
                return data.results || [];
            } catch (e) {
                console.error('Search failed', e);
                return [];
            }
        })();

        await simulationPromise;
        const realResults = await fetchPromise;

        setProgress(100);
        setSearchStatus("Complete");

        // Small delay to let user see 100%
        await new Promise(r => setTimeout(r, 400));

        setResults(realResults);
        setIsSearching(false);
    };

    // Handle Enter Key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Clear search helper
    const handleClear = () => {
        setQuery('');
        setResults([]);
        setIsSearching(false);
        setProgress(0);
        setHasSearched(false);
        setLastSearchedQuery('');
        setLocationError(null);
    };

    return (
        // Use 100dvh for better mobile browser support (address bar handling)
        <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-black">
            {/* Navigation Wrapper - Absolute to avoid flex centering */}
            {!selectedResult && (
                <div className="absolute top-0 left-0 right-0 z-[100]">
                    <SegmentedNav activeTab={activeTab} onTabChange={handleTabChange} />
                </div>
            )}

            {/* Render AuthModal if needed locally, although Header has one too. Only one should be open. */}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <ProfileGateModal
                isOpen={isProfileGateOpen}
                onClose={() => setIsProfileGateOpen(false)}
                currentCount={favoriteMarketCount}
                requiredCount={3}
            />

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
                    <div className={`relative z-10 w-full px-4 md:px-6 flex flex-col items-center transition-all duration-500 ${(results.length > 0 || isSearching || hasSearched) ? 'pt-44 justify-start h-full' : 'justify-center h-full'}`}>
                        {/* Title - fades out when searching to make room */}
                        {results.length === 0 && !isSearching && !hasSearched && (
                            <div className="flex flex-col items-center">
                                <h1
                                    onClick={() => {
                                        const newCount = titleClickCount + 1;
                                        setTitleClickCount(newCount);
                                        if (newCount >= 10) {
                                            router.push('/admin-login');
                                            setTitleClickCount(0);
                                        }
                                    }}
                                    className="text-[13vw] md:text-9xl font-bold text-white mb-2 tracking-tighter drop-shadow-2xl text-center select-none font-sans leading-tight animate-scale-up cursor-pointer"
                                >
                                    Tenbyten
                                </h1>
                                <p className="text-white/70 text-sm md:text-lg font-medium tracking-wide text-center font-sans mb-6">
                                    Find your next market
                                </p>
                            </div>
                        )}

                        {/* Search Bar Container - Transitions from Center to Top */}
                        <div className={`w-full max-w-2xl flex flex-col items-center transition-all duration-500 z-50 ${(results.length > 0 || isSearching || hasSearched) ? 'mb-4' : 'mb-8'}`}>
                            {/* Back Button (Only visible when results exist) */}
                            <div className="w-full flex items-center gap-3">
                                {(results.length > 0) && (
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
                                    <div className={`relative w-8 h-8 rounded-full bg-gradient-to-b from-[#8beca8] to-[#15803d] shadow-[inset_0_0_10px_rgba(255,255,255,0.6),0_4px_10px_rgba(22,101,52,0.4)] mr-2 flex-shrink-0 transition-transform duration-700 ${isSearching ? 'animate-pulse scale-110' : ''}`}>
                                        <div className="absolute top-[10%] left-[15%] w-[40%] h-[25%] bg-gradient-to-b from-white to-transparent rounded-full opacity-90 blur-[1px]" />
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
                                            onKeyDown={handleKeyDown}
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
                                    <button
                                        onClick={() => handleSearch()}
                                        className="ml-2 px-4 py-1.5 bg-[#4285f4] text-white rounded-full text-sm font-semibold hover:bg-[#3367d6] transition-colors shadow-md active:scale-95"
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>

                            {/* PROGRESS BAR & STATUS */}
                            {isSearching && (
                                <div className="w-full max-w-xl mt-6 px-4 animate-fade-in flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-xs font-mono text-[#8beca8] uppercase tracking-widest">
                                        <span>{searchStatus}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#8beca8] to-emerald-500 shadow-[0_0_10px_#8beca8] transition-all duration-300 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search Results Grid - iOS 26 Glass Style */}
                        {results.length > 0 && (
                            <div className="w-full max-w-2xl animate-slide-up pb-32 h-full overflow-y-auto no-scrollbar z-[9999] relative mt-4">
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
                                                            {/* Trust Score Badge */}
                                                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold">
                                                                ★ 9.2
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

                        {/* Empty State */}
                        {results.length === 0 && !isSearching && hasSearched && (
                            <div className="w-full max-w-2xl mt-6 animate-fade-in">
                                <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-6 md:p-8 text-center">
                                    <div className="text-white text-lg md:text-xl font-semibold tracking-tight">
                                        No results found
                                    </div>
                                    {lastSearchedQuery && (
                                        <div className="mt-2 text-white/60 text-sm md:text-base">
                                            "{lastSearchedQuery}"
                                        </div>
                                    )}
                                    {locationError && (
                                        <div className="mt-2 text-white/60 text-xs md:text-sm">
                                            {locationError}
                                        </div>
                                    )}
                                    <div className="mt-3 text-white/50 text-xs md:text-sm">
                                        Try searching by time, category, or location:
                                    </div>
                                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                                        {emptyStateSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion.query}
                                                onClick={() => handleSearch(suggestion.query)}
                                                className="px-4 py-2 rounded-full border border-white/20 bg-white/5 text-white/80 text-xs md:text-sm hover:bg-white/10 transition-colors"
                                            >
                                                {suggestion.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* Buttons (Hidden when searching) */}
                        {results.length === 0 && !isSearching && !hasSearched && (
                            <div className="flex flex-wrap justify-center gap-3 md:gap-4 w-full px-2">
                                <button
                                    onClick={() => setActiveTab('trending')}
                                    className="px-6 py-3 md:py-2.5 rounded-full border border-white/60 bg-white/10 text-white text-sm md:text-base font-medium hover:bg-white/20 active:bg-white/30 transition-all backdrop-blur-sm whitespace-nowrap active:scale-95 shadow-lg"
                                >
                                    Trending Markets
                                </button>
                                <a href="https://heretoday.vercel.app/" className="px-6 py-3 md:py-2.5 rounded-full border border-white/60 bg-white/10 text-white text-sm md:text-base font-medium hover:bg-white/20 active:bg-white/30 transition-all backdrop-blur-sm whitespace-nowrap active:scale-95 shadow-lg flex items-center justify-center">
                                    Digital Card
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Footer Text */}
                    <div className="absolute bottom-6 md:bottom-6 text-white/40 text-[10px] md:text-[10px] text-center px-6 w-full uppercase tracking-widest font-medium leading-relaxed">
                        tenbyten.vercel.app rights reserved by tenbyten
                    </div>
                </>
            )}

            {/* MAP VIEW */}
            {activeTab === 'map' && (
                <div className="absolute inset-0 z-[40] bg-black animate-fade-in">
                    <MapContainer />
                </div>
            )}

            {/* TRENDING VIEW */}
            {activeTab === 'trending' && (
                <div className="absolute inset-0 z-[50] bg-black animate-slide-up overflow-y-auto">
                    <TrendingList
                        onSelect={setSelectedResult}
                        onBack={() => setActiveTab('search')}
                    />
                </div>
            )}

            {/* LIST VIEW (Google Style) */}
            {activeTab === 'list' && (
                <div className="absolute inset-0 z-[40] bg-[#202124] animate-fade-in overflow-y-auto">
                    <PublicListView onSelect={setSelectedResult} />
                </div>
            )}

            {/* Detail Modal Integration - Global Overlay */}
            {selectedResult && (
                <OpportunityDetail
                    data={selectedResult}
                    onClose={() => setSelectedResult(null)}
                />
            )}
        </div>
    );
};

export default RevolutionHero;
