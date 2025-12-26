import React from 'react';
import { BarChart3 } from 'lucide-react';

const SearchLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 w-full">
            {/* Animation Container */}
            <div className="relative mb-8">
                {/* Outer Pulsing Ring */}
                <div className="absolute inset-0 rounded-full border border-emerald-500/20 scale-150 animate-ping opacity-20 duration-2000"></div>
                <div className="absolute inset-0 rounded-full border border-emerald-500/20 scale-125 animate-pulse duration-3000"></div>

                {/* Rotating Progress Ring */}
                <div className="w-24 h-24 rounded-full border-4 border-emerald-500/10 relative animate-spin-slow">
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-emerald-500 border-t-transparent border-r-transparent animate-spin"></div>
                </div>

                {/* Inner Icon Circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <BarChart3 className="text-white w-8 h-8 animate-pulse" strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            {/* Text Content */}
            <div className="text-center space-y-2 animate-fade-in-up">
                <h3 className="text-xl font-medium text-white tracking-tight">
                    Finding the best spots...
                </h3>
                <p className="text-sm text-gray-400 font-light">
                    Searching markets, consignment shops, and events
                </p>
            </div>
        </div>
    );
};

export default SearchLoader;
