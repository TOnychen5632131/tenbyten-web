'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import { User } from 'lucide-react';

const Header = () => {
    const { user, profile, loading } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const pathname = usePathname();

    // Hide Header on admin pages
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-[2px]">
                <div className="flex items-center gap-4">
                    {/* Tenbyten Logo - Left */}
                    <Link href="/">
                        <div className="flex items-center justify-center p-2 rounded-full bg-[#1F1F1F] hover:bg-[#303030] transition-colors cursor-pointer w-auto h-10 md:h-12 shrink-0 px-4">
                            <span className="text-white font-bold tracking-tight">Tenbyten</span>
                        </div>
                    </Link>

                    {/* Greeting Text - Mobile/Desktop - Conditional */}
                    {user && (
                        <div className="hidden md:flex flex-col justify-center">
                            <span className="text-gray-400 text-sm md:text-base font-medium leading-none mb-1">Good evening,</span>
                            <span className="text-gray-500 text-xs md:text-sm leading-none">
                                {profile?.brand_name || user.email?.split('@')[0] || 'Vendor'}
                            </span>
                        </div>
                    )}
                </div>

                {/* User Profile / Login - Right */}
                {!loading && (
                    <div className="flex items-center gap-3">
                        {user ? (
                            <Link href="/onboarding">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 overflow-hidden border border-gray-600 shrink-0 cursor-pointer hover:border-white transition-colors">
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="px-4 py-2 bg-white text-black font-bold text-sm rounded-full hover:bg-gray-200 transition-colors"
                            >
                                Login / Join
                            </button>
                        )}
                    </div>
                )}
            </header>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
};

export default Header;
