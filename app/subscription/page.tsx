'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, Shield, Star, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';

export default function SubscriptionPage() {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const checkStatus = async () => {
            if (!user) return;
            const { data } = await supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle();
            if (data?.status === 'active' || data?.status === 'trialing') {
                router.replace('/onboarding');
            }
        };
        checkStatus();
    }, [user, router]);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                alert('You must be logged in to subscribe.');
                router.push('/admin-login');
                return;
            }

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('No checkout URL returned:', data.error);
                alert(data.error || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 flex flex-col items-center justify-center p-4 pt-24 font-sans relative overflow-hidden">

            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-200/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/20 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-4xl relative z-10 animate-fade-in-up flex flex-col items-center">

                {/* Header - Compact */}
                <div className="text-center mb-6 max-w-2xl">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight text-gray-900">
                        Unlock Your Full Potential
                    </h1>
                    <p className="text-lg text-gray-500 leading-snug">
                        Join the community of premium vendors and start growing your business.
                    </p>
                </div>

                {/* Pricing Card - Compact */}
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100 transform hover:scale-[1.01] transition-transform duration-500 relative ring-1 ring-gray-900/5">

                    {/* Banner */}
                    <div className="bg-emerald-500 p-2 text-center text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                        First Month Free Trial
                    </div>

                    <div className="p-6 md:p-8">
                        <div className="flex items-baseline justify-center gap-1 mb-1">
                            <span className="text-5xl font-extrabold text-gray-900 tracking-tighter">$9.90</span>
                            <span className="text-lg text-gray-500 font-medium">/ month</span>
                        </div>
                        <p className="text-center text-emerald-600 font-semibold mb-6 text-xs uppercase tracking-wide">
                            $0.00 due today • Cancel anytime
                        </p>

                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full bg-black text-white font-bold py-3.5 rounded-lg hover:bg-gray-800 transition-all hover:shadow-lg flex items-center justify-center gap-2 text-base mb-6 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Start Free Trial'}
                            </span>
                        </button>

                        <div className="space-y-3 pt-1">
                            <FeatureItem text="Unlimited Market Listings" />
                            <FeatureItem text="Priority Placement in Search" />
                            <FeatureItem text="Advanced Analytics Dashboard" />
                            <FeatureItem text="Direct Messaging with Organizers" />
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                            <Shield size={10} /> Secure payment via Stripe
                        </p>
                    </div>
                </div>

                {/* Social Proof / Trust - Compact */}
                <div className="mt-8 flex justify-center gap-8 text-gray-300">
                    <div className="flex flex-col items-center gap-1">
                        <Star size={20} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Premium</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Zap size={20} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Fast</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Shield size={20} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ text, icon }: { text: string, icon?: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 group">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                {icon || <Check size={12} strokeWidth={3} />}
            </div>
            <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">{text}</span>
        </div>
    );
}
