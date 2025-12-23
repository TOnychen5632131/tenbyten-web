'use client';
import React from 'react';
import { Plus, Mic } from 'lucide-react';

const SearchSection = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full px-4 mt-20 md:mt-32">
            {/* Tenbyten Text Logo */}
            <h1 className="text-5xl md:text-8xl font-medium text-[#9aa0a6] mb-8 md:mb-12 tracking-tighter opacity-90">
                Tenbyten
            </h1>

            {/* Search Bar Container */}
            <div className="relative w-full max-w-md md:max-w-2xl group">
                {/* Glowing Gradient Background/Border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500 rounded-full opacity-70 blur-md transition duration-1000 group-hover:opacity-100 group-hover:duration-200 animate-pulse-slow"></div>
                <div className="absolute -inset-[1px] bg-gradient-to-r from-[#4285F4] via-[#A64D79] to-[#FBBC05] rounded-full opacity-100"></div>

                {/* Input Inner */}
                <div className="relative flex items-center w-full bg-[#202124] rounded-full px-5 py-3 md:py-4">
                    {/* Left Icon (Plus) */}
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <Plus size={24} strokeWidth={2.5} />
                    </button>

                    {/* Input Field */}
                    <input
                        type="text"
                        placeholder="Search or ask"
                        className="flex-1 bg-transparent border-none outline-none text-white text-lg md:text-xl px-4 placeholder-gray-500 font-normal"
                    />

                    {/* Right Icon (Mic) */}
                    <button className="p-2">
                        {/* Multi-color Mic Icon Simulation */}
                        <div className="relative">
                            <Mic className="text-white" size={24} />
                            {/* Optional: We could try to color the mic parts, but white/standard is safer. 
                        The image shows a colored mic. Let's stick to standard Lucide but maybe color it.
                        Actually, Google mic is detailed. Let's just use the standard icon with standard Google colors if possible, 
                        or just a white/colored tint.
                        Let's use a gradient text clip or just a specific color. Source image has a standard colored Google mic.
                        I'll use a simple colored SVG or just tint the Lucide icon for now to Blue or Red.
                     */}
                        </div>
                    </button>
                    <div className="ml-2">
                        <img src="https://www.gstatic.com/images/branding/googlemic/2x/googlemic_color_24dp.png" alt="mic" className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchSection;
