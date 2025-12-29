'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, X } from 'lucide-react';

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

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const missingCount = Math.max(0, requiredCount - currentCount);

    const content = (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-[#141414]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Complete Your Vendor Profile</h2>
                        <p className="text-white/50 text-sm mt-1">Favorite markets required for full access.</p>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={22} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-200/90 text-sm flex gap-3">
                        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                        <div>
                            We review vendor access to keep Tenbyten vendor-only. Thanks for understanding.
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-white/70 text-sm">
                            {currentCount} of {requiredCount} favorite markets added
                        </div>
                        <div className="text-xs font-semibold text-white/60">
                            {missingCount > 0 ? `${missingCount} remaining` : 'Complete'}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            onClose();
                            router.push('/onboarding');
                        }}
                        className="w-full rounded-2xl bg-white text-black font-bold py-3 transition-all hover:bg-gray-200 active:scale-[0.99]"
                    >
                        Complete Profile
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 text-white/70 py-3 text-sm hover:bg-white/10 transition-colors"
                    >
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );

    const { createPortal } = require('react-dom');
    return createPortal(content, document.body);
};

export default ProfileGateModal;
