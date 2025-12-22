'use client';
import React from 'react';
import { Compass, AppWindow, User } from 'lucide-react';

const BottomNav = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe md:pb-4 pt-4 px-8 z-50">
            <div className="flex items-center justify-between max-w-md mx-auto">
                {/* Compass / Explore */}
                <button className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors">
                    <Compass size={28} strokeWidth={2} />
                </button>

                {/* Windows / Tabs */}
                <button className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors">
                    <AppWindow size={28} strokeWidth={2} />
                </button>

                {/* User Profile */}
                <button className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors">
                    <User size={28} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
