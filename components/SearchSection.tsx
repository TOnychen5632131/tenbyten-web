'use client';
import React from 'react';
import { Plus, Mic } from 'lucide-react';

const SearchSection = () => {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [showResults, setShowResults] = React.useState(false);

    // Use a ref to track the latest query for debouncing, avoiding re-renders just for the timeout logic
    const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

    const handleSearch = async (term: string) => {
        if (!term.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        console.log("Searching for:", term);
        setIsLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
            const data = await res.json();
            console.log("Search results:", data);

            if (data.results && data.results.length > 0) {
                setResults(data.results);
                setShowResults(true);
            } else {
                setResults([]);
                setShowResults(true); // Show dropdown even if empty to display "No results"
            }
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
            setShowResults(true); // Show error/empty state
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // Debounce search
        searchTimeout.current = setTimeout(() => {
            handleSearch(val);
        }, 600);
    };

    // Handle manual search button click
    const handleManualSearch = () => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        handleSearch(query);
    };

    console.log("Render: showResults =", showResults, "count =", results.length);

    return (
        <div className="flex flex-col items-center justify-center w-full px-4 mt-20 md:mt-32 relative z-[100]">
            {/* Tenbyten Text Logo */}
            <h1 className="text-5xl md:text-8xl font-medium text-[#9aa0a6] mb-8 md:mb-12 tracking-tighter opacity-90">
                Tenbyten
            </h1>

            {/* DEBUG: Visible Counter */}
            <div className="text-red-500 font-bold mb-4 z-[9999] relative">
                Debug State: Show={showResults.toString()}, Count={results.length}
            </div>

            {/* Search Bar Container */}
            <div className="relative w-full max-w-md md:max-w-2xl group z-[101]">
                {/* Glowing Gradient Background/Border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500 rounded-2xl opacity-70 blur-md transition duration-1000 group-hover:opacity-100 group-hover:duration-200 animate-pulse-slow"></div>
                <div className="absolute -inset-[1px] bg-gradient-to-r from-[#4285F4] via-[#A64D79] to-[#FBBC05] rounded-2xl opacity-100"></div>

                {/* Input Inner */}
                <div className="relative flex flex-col w-full bg-[#202124] rounded-2xl shadow-2xl">
                    <div className="flex items-center w-full px-5 py-3 md:py-4">
                        {/* Left Icon (Plus) */}
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                            <Plus size={24} strokeWidth={2.5} />
                        </button>

                        {/* Input Field */}
                        <input
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                            onFocus={() => {
                                if (results.length > 0) setShowResults(true);
                            }}
                            placeholder="Search or ask (e.g. 'markets nearby next Sunday')"
                            className="flex-1 bg-transparent border-none outline-none text-white text-lg md:text-xl px-4 placeholder-gray-500 font-normal min-w-0"
                            style={{ zIndex: 102 }}
                        />

                        {/* Right Actions */}
                        <div className="ml-2 flex items-center gap-3">
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                // Search Button instead of Mic for clarity if needed, or keeping Mic
                                <button onClick={handleManualSearch} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors">
                                    Search
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results Dropdown - Absolute positioning relative to the Input Inner container */}
                    {showResults && (
                        <div
                            className="absolute top-full left-0 right-0 mt-2 bg-[#202124] border border-white/10 rounded-xl overflow-y-auto max-h-[60vh] custom-scrollbar shadow-2xl"
                            style={{ zIndex: 9999 }}
                        >
                            <div className="p-2 space-y-1">
                                {results.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        <p className="text-sm">No results found.</p>
                                        <p className="text-xs mt-1 opacity-70">Try using different keywords or checking the date.</p>
                                    </div>
                                ) : (
                                    results.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="p-4 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group/item block text-left"
                                            onClick={() => window.location.href = `/opportunity/${item.id}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-white font-medium text-lg group-hover/item:text-blue-400 transition-colors">
                                                    {item.title}
                                                </h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${item.type === 'MARKET'
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                    }`}>
                                                    {item.type}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div
                                className="px-4 py-3 bg-white/5 text-center text-xs text-gray-500 border-t border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowResults(false);
                                }}
                            >
                                Close Results
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Backdrop to close results when clicking outside */}
            {showResults && (
                <div
                    className="fixed inset-0 z-[90]"
                    onClick={() => setShowResults(false)}
                />
            )}
        </div>
    );
};

export default SearchSection;
