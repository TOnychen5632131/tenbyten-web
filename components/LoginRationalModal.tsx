'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, X, Server, Users } from 'lucide-react';

interface LoginRationalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
}

const LoginRationalModal = ({
    isOpen,
    onClose,
    onLogin
}: LoginRationalModalProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const content = (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-[#141414]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Access Restricted</h2>
                        <p className="text-white/50 text-sm mt-1">Please verify your identity.</p>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={22} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-5">

                    {/* Access Warning */}
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <ShieldCheck size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-amber-200 font-bold text-sm mb-1">Login Required</h3>
                            <p className="text-amber-200/70 text-xs leading-relaxed">
                                You are currently not logged in. To access the List and Map views, we require all users to sign in.
                            </p>
                        </div>
                    </div>

                    {/* Reasons Grid */}
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                <Users size={16} className="text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-sm">Real People Only</h4>
                                <p className="text-white/40 text-xs">We ensure our community is made of real, verified users.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Server size={16} className="text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-sm">Server Protection</h4>
                                <p className="text-white/40 text-xs">Login safeguards our free servers from overload and bots.</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 gap-3 flex flex-col">
                        <button
                            onClick={onLogin}
                            className="w-full rounded-2xl bg-white text-black font-bold py-3.5 transition-all hover:bg-gray-200 active:scale-[0.99] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            Log In / Register
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full text-center text-white/40 text-xs hover:text-white/60 transition-colors"
                        >
                            No thanks, maybe later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Use portal to ensure it renders on top of everything
    const { createPortal } = require('react-dom');
    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
};

export default LoginRationalModal;
