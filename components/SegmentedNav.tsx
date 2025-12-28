'use client';
import React from 'react';

interface SegmentedNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const SegmentedNav = ({ activeTab, onTabChange }: SegmentedNavProps) => {
    return (
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center w-full px-4">
            <div className="relative grid grid-cols-3 w-[320px] items-center bg-white/10 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-2xl">
                {/* Sliding Background for Active State */}
                <div
                    className={`absolute top-1.5 bottom-1.5 rounded-full bg-white/20 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-inner w-[calc(33.33%-6px)] ${activeTab === 'search' ? 'left-1.5' :
                        activeTab === 'map' ? 'left-[calc(33.33%+2px)]' :
                            'left-[calc(66.66%+2px)]' // simplified calculation relative to parent width
                        }`}
                />

                <button
                    onClick={() => onTabChange('search')}
                    className={`relative z-10 w-full px-4 py-2 text-sm md:text-base font-medium transition-colors duration-300 ${activeTab === 'search' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                >
                    Search
                </button>
                <button
                    onClick={() => onTabChange('map')}
                    className={`relative z-10 w-full px-4 py-2 text-sm md:text-base font-medium transition-colors duration-300 ${activeTab === 'map' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                >
                    Map
                </button>
                <button
                    onClick={() => onTabChange('list')}
                    className={`relative z-10 w-full px-4 py-2 text-sm md:text-base font-medium transition-colors duration-300 ${activeTab === 'list' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                >
                    List
                </button>
            </div>
        </div>
    );
};

export default SegmentedNav;
