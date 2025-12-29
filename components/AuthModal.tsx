'use client';

import React, { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { X, Loader2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
    const router = useRouter();
    const [view, setView] = useState<'login' | 'register'>(initialView);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            onClose();
            // Router refresh or redirect will be handled by AuthContext or protected route logic if needed
            // Check if profile exists happens in global layout/context usually, but we can do a quick check here if we want immediate redirect
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('vendor_profiles')
                    .select('id')
                    .eq('id', user.id)
                    .single();

                if (!profile) {
                    router.push('/onboarding');
                }
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // 1. Verify Invite Code (if provided)
            let validCode = false;

            if (inviteCode.trim()) {
                const { data: codeData, error: codeError } = await supabase
                    .from('invite_codes')
                    .select('*')
                    .eq('code', inviteCode.trim())
                    .eq('is_used', false)
                    .single();

                if (codeError || !codeData) {
                    throw new Error('Invalid or used invite code.');
                }
                validCode = true;
            }

            // 2. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (authData.user) {
                if (authData.session) {
                    // 3. Mark invite code as used (if one was provided and valid)
                    if (validCode && inviteCode.trim()) {
                        await supabase
                            .from('invite_codes')
                            .update({ is_used: true })
                            .eq('code', inviteCode.trim());
                    }

                    // 4. Redirect to onboarding
                    router.push('/onboarding');
                    onClose();
                } else {
                    // Email confirmation required
                    alert('Registration successful! Please check your email to confirm your account before logging in.');
                    setView('login');
                }
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-up">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        {view === 'login' ? 'Welcome Back' : 'Vendor Access'}
                    </h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">

                        {/* Invite Code (Register Only) */}
                        {view === 'register' && (
                            <div className="space-y-1">
                                <label className="text-xs font-mono text-white/50 uppercase tracking-widest">Invite Code (Optional)</label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                                    placeholder="ENTER-CODE"
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs font-mono text-white/50 uppercase tracking-widest">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs font-mono text-white/50 uppercase tracking-widest">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Confirm Password (Register Only) */}
                        {view === 'register' && (
                            <div className="space-y-1">
                                <label className="text-xs font-mono text-white/50 uppercase tracking-widest">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 bg-white text-black font-bold py-3.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    {view === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                    <p className="text-white/60 text-sm">
                        {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => {
                                setView(view === 'login' ? 'register' : 'login');
                                setError(null);
                            }}
                            className="text-white font-bold hover:underline"
                        >
                            {view === 'login' ? 'Register' : 'Login'}
                        </button>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default AuthModal;
