'use client';
import React from 'react';
import Image from 'next/image';

const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-[2px]">
            <div className="flex items-center gap-4">
                {/* Tenbyten Logo - Left */}
                <div className="flex items-center justify-center p-2 rounded-full bg-[#1F1F1F] hover:bg-[#303030] transition-colors cursor-pointer w-auto h-10 md:h-12 shrink-0 px-4">
                    <span className="text-white font-bold tracking-tight">Tenbyten</span>
                </div>

                {/* Greeting Text - Mobile/Desktop */}
                <div className="flex flex-col justify-center">
                    <span className="text-gray-400 text-sm md:text-base font-medium leading-none mb-1">Good evening,</span>
                    <span className="text-gray-500 text-xs md:text-sm leading-none">Roman</span>
                </div>
            </div>

            {/* User Profile - Right */}
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 overflow-hidden border border-gray-600 shrink-0">
                <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Roman"
                    alt="Profile"
                    className="w-full h-full object-cover"
                />
            </div>
        </header>
    );
};

export default Header;
