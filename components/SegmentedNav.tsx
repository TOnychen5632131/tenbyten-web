'use client';
import React from 'react';

interface SegmentedNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    forceDark?: boolean;
}

const SegmentedNav = ({ activeTab, onTabChange, forceDark = false }: SegmentedNavProps) => {
    const containerTone = forceDark
        ? "bg-white/10 border-white/10"
        : "bg-white/80 border-border dark:bg-white/10 dark:border-white/10";
    const sliderTone = forceDark
        ? "bg-white/20"
        : "bg-foreground/10 dark:bg-white/20";
    const activeTextTone = forceDark
        ? "text-white"
        : "text-foreground dark:text-white";
    const inactiveTextTone = forceDark
        ? "text-white/50 hover:text-white/80"
        : "text-muted-foreground hover:text-foreground dark:text-white/50 dark:hover:text-white/80";

    return (
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center w-full px-4">
            <div className={`relative grid grid-cols-3 w-[320px] items-center backdrop-blur-xl border rounded-full p-1.5 shadow-2xl ${containerTone}`}>
                {/* Sliding Background for Active State */}
                <div
                    className={`absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-inner w-[calc(33.33%-6px)] ${sliderTone} ${activeTab === 'search' ? 'left-1.5' :
                        activeTab === 'map' ? 'left-[calc(33.33%+2px)]' :
                            'left-[calc(66.66%+2px)]' // simplified calculation relative to parent width
                        }`}
                />

                <button
                    onClick={() => onTabChange('search')}
                    className={`relative z-10 w-full px-4 py-2 text-sm md:text-base font-medium transition-colors duration-300 ${activeTab === 'search' ? activeTextTone : inactiveTextTone}`}
                >
                    Search
                </button>
                <button
                    onClick={() => onTabChange('map')}
                    className={`relative z-10 w-full px-4 py-2 text-sm md:text-base font-medium transition-colors duration-300 ${activeTab === 'map' ? activeTextTone : inactiveTextTone}`}
                >
                    Map
                </button>
                <button
                    onClick={() => onTabChange('list')}
                    className={`relative z-10 w-full px-4 py-2 text-sm md:text-base font-medium transition-colors duration-300 ${activeTab === 'list' ? activeTextTone : inactiveTextTone}`}
                >
                    List
                </button>
            </div>
        </div>
    );
};

export default SegmentedNav;
