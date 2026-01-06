'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import { Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';

const Header = () => {
    const { user, profile, loading } = useAuth();
    const { resolvedTheme, setTheme } = useTheme();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();
    const isDark = resolvedTheme === 'dark';
    const shouldHideHeader = pathname?.startsWith('/admin');

    // Hide Header on admin pages
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (shouldHideHeader) {
        return null;
    }

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-[2px]">
                <div className="flex items-center gap-4">
                    {/* Tenbyten Logo - Left */}
                    <Link href="/">
                        <div className="flex items-center justify-center p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors cursor-pointer w-auto h-10 md:h-12 shrink-0 px-4 border border-border">
                            <span className="text-foreground font-bold tracking-tight">Tenbyten</span>
                        </div>
                    </Link>

                    {/* Greeting Text - Mobile/Desktop - Conditional */}
                    {user && (
                        <div className="hidden md:flex flex-col justify-center">
                            <span className="text-muted-foreground text-sm md:text-base font-medium leading-none mb-1">Good evening,</span>
                            <span className="text-muted-foreground/70 text-xs md:text-sm leading-none">
                                {profile?.brand_name || user.email?.split('@')[0] || 'Vendor'}
                            </span>
                        </div>
                    )}
                </div>

                {/* User Profile / Login - Right */}
                {!loading && (
                    <div className="flex items-center gap-3">
                        {isMounted ? (
                            <button
                                type="button"
                                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-border bg-foreground/10 text-foreground transition-colors hover:bg-foreground/20"
                                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        ) : (
                            <div className="h-10 w-10 md:h-12 md:w-12" aria-hidden />
                        )}
                        {user ? (
                            <Link href="/onboarding">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-foreground/10 overflow-hidden border border-border shrink-0 cursor-pointer hover:border-foreground/60 transition-colors">
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-foreground/10 text-foreground">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="px-4 py-2 bg-foreground text-background font-bold text-sm rounded-full hover:bg-foreground/90 transition-colors"
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
