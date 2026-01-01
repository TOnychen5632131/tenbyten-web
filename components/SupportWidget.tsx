'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, MessageCircle, X } from 'lucide-react';

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
const THREAD_STORAGE_KEY = 'tenbyten_support_thread_id';

const createThreadId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const rand = Math.random() * 16 | 0;
        const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
        return value.toString(16);
    });
};

const getStoredThreadId = () => {
    if (typeof window === 'undefined') return '';

    try {
        const existing = window.localStorage.getItem(THREAD_STORAGE_KEY);
        if (existing) return existing;
        const fresh = createThreadId();
        window.localStorage.setItem(THREAD_STORAGE_KEY, fresh);
        return fresh;
    } catch {
        return createThreadId();
    }
};

type Step = 'email' | 'message' | 'success';

const SupportWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [threadId, setThreadId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const emailIsValid = useMemo(() => isValidEmail(email.trim()), [email]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeydown);
        return () => document.removeEventListener('keydown', handleKeydown);
    }, [isOpen]);

    useEffect(() => {
        const stored = getStoredThreadId();
        if (stored) {
            setThreadId(stored);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setError('');
        }
    }, [isOpen]);

    const resetForm = () => {
        setStep('email');
        setEmail('');
        setMessage('');
        setError('');
        setIsSubmitting(false);
    };

    const handleContinue = (event: React.FormEvent) => {
        event.preventDefault();
        if (!emailIsValid) {
            setError('Please enter a valid email.');
            return;
        }
        setError('');
        setStep('message');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedMessage = message.trim();
        const resolvedThreadId = threadId || getStoredThreadId();

        if (!trimmedMessage) {
            setError('Please write a message.');
            return;
        }

        if (!resolvedThreadId) {
            setError('Unable to start a support thread. Please refresh and try again.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId: resolvedThreadId,
                    email: email.trim(),
                    message: trimmedMessage,
                    pageUrl: window.location.href,
                    source: 'floating_chat'
                })
            });
            const data = await res.json();

            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'Submission failed.');
            }

            if (!threadId) {
                setThreadId(resolvedThreadId);
            }

            setStep('success');
            setMessage('');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        if (step === 'success') {
            resetForm();
        }
    };

    const handleStartOver = () => {
        resetForm();
        setIsOpen(true);
    };

    return (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[60] flex flex-col items-end gap-3">
            {isOpen && (
                <div className="w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#111] shadow-2xl shadow-black/40 overflow-hidden animate-slide-up">
                    <div className="flex items-start justify-between gap-4 px-4 py-4 border-b border-white/5">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Customer Support</h3>
                            <p className="text-xs text-white/50 mt-1">
                                Leave a message and we will reply by email.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-white/40 hover:text-white transition-colors"
                            aria-label="Close support"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="px-4 py-4">
                        {step === 'email' && (
                            <form onSubmit={handleContinue} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/40">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (error) setError('');
                                        }}
                                        className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-white/30 outline-none transition-colors"
                                        placeholder="you@email.com"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-400 text-xs">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full bg-white text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                                >
                                    Continue
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        )}

                        {step === 'message' && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex items-center justify-between text-xs text-white/50">
                                    <span>{email}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('email');
                                            setError('');
                                        }}
                                        className="text-white/60 hover:text-white transition-colors"
                                    >
                                        Change email
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-white/40">
                                        Message
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={message}
                                        onChange={(e) => {
                                            setMessage(e.target.value);
                                            if (error) setError('');
                                        }}
                                        className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-white/30 outline-none transition-colors"
                                        placeholder="Tell us what you need help with."
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-400 text-xs">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-white text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>Send Message</>
                                    )}
                                </button>
                            </form>
                        )}

                        {step === 'success' && (
                            <div className="space-y-3 text-sm text-white">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <CheckCircle2 size={18} />
                                    Message sent
                                </div>
                                <p className="text-white/60 text-xs">
                                    Thanks! We will reply to {email} soon.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleStartOver}
                                        className="flex-1 bg-white/10 text-white text-xs font-semibold py-2 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        Send another
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 bg-white text-black text-xs font-semibold py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="h-14 w-14 rounded-full bg-white text-black shadow-xl shadow-black/30 flex items-center justify-center hover:bg-gray-200 transition-colors"
                aria-label="Open support"
            >
                <MessageCircle size={22} />
            </button>
        </div>
    );
};

export default SupportWidget;
