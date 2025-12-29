'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';

const DEFAULT_FORM = {
    name: '',
    email: '',
    company: '',
    location: '',
    partnershipType: 'Market Partnership',
    website: '',
    message: ''
};

const AboutPage = () => {
    const [formData, setFormData] = useState(DEFAULT_FORM);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!formData.name.trim()) return 'Please add your name.';
        if (!formData.email.trim()) return 'Please add your email.';
        if (!formData.message.trim()) return 'Please tell us what you have in mind.';
        return '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        const validationError = validate();
        if (validationError) {
            setErrorMessage(validationError);
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('/api/partnerships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'Submission failed.');
            }
            setStatus('success');
            setFormData(DEFAULT_FORM);
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back to search
                    </Link>
                </div>

                <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
                    <section className="space-y-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                About Tenbyten
                            </h1>
                            <p className="text-white/60 text-base md:text-lg mt-4 leading-relaxed">
                                Tenbyten helps vintage vendors, makers, and small brands discover the best
                                markets and consignment opportunities. We curate listings, surface real
                                details, and make it easier to find the right fit quickly.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-4">
                            <h2 className="text-xl font-semibold">What we care about</h2>
                            <div className="grid gap-3 text-white/60 text-sm md:text-base">
                                <div>- Better discovery for vendors and market organizers.</div>
                                <div>- Clear, accurate details that make decisions faster.</div>
                                <div>- Community-first growth across vintage, craft, and food.</div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 md:p-8">
                            <h2 className="text-xl font-semibold">Interested in partnering?</h2>
                            <p className="text-white/60 text-sm md:text-base mt-3 leading-relaxed">
                                We collaborate with markets, organizers, brands, and local communities.
                                Share your idea and we will get back to you.
                            </p>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-[#0f0f0f] p-6 md:p-8">
                        <h2 className="text-xl font-semibold">Partnership Request</h2>
                        <p className="text-white/50 text-sm mt-2">
                            Fill this out and we will reply within a few business days.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                                        Name
                                    </label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-white/30 outline-none transition-colors"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                                        Email
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-white/30 outline-none transition-colors"
                                        placeholder="you@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                                        Company
                                    </label>
                                    <input
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-white/30 outline-none transition-colors"
                                        placeholder="Brand or organization"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                                        Location
                                    </label>
                                    <input
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-white/30 outline-none transition-colors"
                                        placeholder="City, State"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                                    Partnership Type
                                </label>
                                <select
                                    name="partnershipType"
                                    value={formData.partnershipType}
                                    onChange={handleChange}
                                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-white/30 outline-none transition-colors"
                                >
                                    <option>Market Partnership</option>
                                    <option>Brand Collaboration</option>
                                    <option>Sponsorship</option>
                                    <option>Press / Media</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                                    Website or Instagram
                                </label>
                                <input
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-white/30 outline-none transition-colors"
                                    placeholder="https://"
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={5}
                                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-white/30 outline-none transition-colors"
                                    placeholder="Tell us about your idea, timeline, or goals."
                                    required
                                />
                            </div>

                            {status === 'error' && (
                                <div className="text-red-400 text-sm">
                                    {errorMessage}
                                </div>
                            )}
                            {status === 'success' && (
                                <div className="text-emerald-400 text-sm">
                                    Thanks! Your request has been submitted.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full mt-2 bg-white text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-60"
                            >
                                <Send size={16} />
                                {status === 'loading' ? 'Sending...' : 'Submit Request'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
