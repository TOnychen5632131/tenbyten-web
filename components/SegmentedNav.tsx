'use client';
import React from 'react';

interface SegmentedNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const SegmentedNav = ({ activeTab, onTabChange }: SegmentedNavProps) => {
    return (
        <div className="absolute top-12 left-0 right-0 z-50 flex justify-center w-full px-4">
            <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-2xl">
                {/* Sliding Background for Active State */}
                <div
                    className={`absolute top-1.5 bottom-1.5 rounded-full bg-white/20 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-inner ${activeTab === 'search' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[50%] w-[calc(50%-6px)]'
                        }`}
                />

                <button
                    onClick={() => onTabChange('search')}
                    className={`relative z-10 px-8 py-2 text-sm md:text-base font-medium transition-colors duration-300 ${activeTab === 'search' ? 'text-white' : 'text-white/50 hover:text-white/80'
                        }`}
                >
                    Search
                </button>
                <button
                    onClick={() => onTabChange('map')}
                    className={`relative z-10 px-8 py-2 text-sm md:text-base font-medium transition-colors duration-300 ${activeTab === 'map' ? 'text-white' : 'text-white/50 hover:text-white/80'
                        }`}
                >
                    Map
                </button>
            </div>
        </div>
    );
};

export default SegmentedNav;
