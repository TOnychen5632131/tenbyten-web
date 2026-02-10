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

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'register' }) => {
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
                    router.push('/subscription');
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

                    // 4. Redirect to subscription
                    router.push('/subscription');
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-gray-100 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-up">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        {view === 'login' ? 'Welcome Back' : 'Vendor Access'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">

                        {/* Invite Code (Register Only) */}
                        {view === 'register' && (
                            <div className="space-y-1">
                                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Invite Code (Optional)</label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-black transition-colors placeholder:text-gray-400"
                                    placeholder="ENTER-CODE"
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-black transition-colors placeholder:text-gray-400"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-black transition-colors placeholder:text-gray-400"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Confirm Password (Register Only) */}
                        {view === 'register' && (
                            <div className="space-y-1">
                                <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-black transition-colors placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 bg-black text-white font-bold py-3.5 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-gray-500 text-sm">
                        {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => {
                                setView(view === 'login' ? 'register' : 'login');
                                setError(null);
                            }}
                            className="text-black font-bold hover:underline"
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
