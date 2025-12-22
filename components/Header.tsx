'use client';
import React from 'react';
import Image from 'next/image';

const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-[2px]">
            <div className="flex items-center gap-4">
                {/* Google G Logo - Left */}
                <div className="flex items-center justify-center p-2 rounded-full bg-[#1F1F1F] hover:bg-[#303030] transition-colors cursor-pointer w-10 h-10 md:w-12 md:h-12 shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
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
