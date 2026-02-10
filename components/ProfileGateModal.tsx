'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';

interface ProfileGateModalProps {
    isOpen: boolean;
    onClose: () => void;
    requiredCount?: number;
    currentCount?: number;
}

const ProfileGateModal = ({
    isOpen,
    onClose,
    requiredCount = 3,
    currentCount = 0
}: ProfileGateModalProps) => {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [checking, setChecking] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        const checkSubscription = async () => {
            if (!isOpen) return;

            setChecking(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setChecking(false);
                return;
            }

            const { data: sub } = await supabase
                .from('subscriptions')
                .select('status')
                .eq('user_id', user.id)
                .maybeSingle();

            const isValid = sub?.status === 'active' || sub?.status === 'trialing';

            if (!isValid) {
                // Not subscribed, redirect to payment
                router.push('/subscription');
            } else {
                setIsSubscribed(true);
                setChecking(false);
            }
        };

        checkSubscription();
    }, [isOpen, router]);

    if (!isOpen || !mounted) return null;

    if (checking) {
        return null; // Or a loading spinner if desired, but hidden is smoother for redirect
    }

    const missingCount = Math.max(0, requiredCount - currentCount);

    const content = (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
                                <Check size={12} strokeWidth={3} />
                            </span>
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Subscription Active</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Complete Your Vendor Profile</h2>
                        <p className="text-gray-500 text-sm mt-1">Setup required for full access.</p>
                    </div>
                    {/* Optional Close Button - removing strictly might force completion, but keeping for UX */}
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={22} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Congratulations Banner */}
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm flex gap-3">
                        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                        <div>
                            <strong>Congratulations!</strong> Your subscription is active. Now, let's verify your profile to start selling.
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-gray-700 text-sm">
                            {currentCount} of {requiredCount} favorite markets added
                        </div>
                        <div className="text-xs font-semibold text-gray-500">
                            {missingCount > 0 ? `${missingCount} remaining` : 'Complete'}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            onClose();
                            router.push('/onboarding');
                        }}
                        className="w-full rounded-2xl bg-black text-white font-bold py-3 transition-all hover:bg-gray-800 active:scale-[0.99] shadow-lg hover:shadow-xl"
                    >
                        Complete Profile
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full rounded-2xl border border-gray-200 bg-white text-gray-500 py-3 text-sm hover:bg-gray-50 transition-colors"
                    >
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );

    // Use createPortal to render at document body level
    const { createPortal } = require('react-dom');
    // Check if document exists (SSR safety)
    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
};

export default ProfileGateModal;
