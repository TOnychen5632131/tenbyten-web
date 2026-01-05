'use client';

import React, { useState } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import MarketForm from '@/components/admin/MarketForm';

type AdmissionFee = {
    label: string;
    price: number | null;
};

type ScheduleSegment = {
    label: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    days: string[];
};

type ParsedMarket = {
    title: string | null;
    description: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    season_start_date: string | null;
    season_end_date: string | null;
    start_time: string | null;
    end_time: string | null;
    application_start_date: string | null;
    application_end_date: string | null;
    additional_schedules: ScheduleSegment[];
    is_indoors: boolean | null;
    electricity_access: boolean | null;
    booth_size: string | null;
    is_schedule_tba: boolean | null;
    application_deadline: string | null;
    vendor_count: number | null;
    admission_fee: number | null;
    admission_fees: AdmissionFee[];
    website: string | null;
    is_trending: boolean | null;
    tags: string[];
    categories: string[];
    is_recurring: boolean | null;
    recurring_pattern: string | null;
    organizer_name: string | null;
};

type MarketImportFormProps = {
    onSuccess?: () => void;
};

const textValue = (value: string | null) => (value ? value.trim() : '');

const numberValue = (value: number | null) => (value === null || !Number.isFinite(value) ? '' : String(value));

const normalizeSchedules = (schedules: ScheduleSegment[]) =>
    Array.isArray(schedules) ? schedules : [];

const normalizeTags = (tags: string[]) =>
    Array.isArray(tags) ? tags.filter(Boolean) : [];

const normalizeCategories = (categories: string[]) =>
    Array.isArray(categories) ? categories.filter(Boolean) : [];

const buildPrefill = (data: ParsedMarket) => {
    const recurringPattern = textValue(data.recurring_pattern);
    const isScheduleTba = data.is_schedule_tba === true;
    const isRecurring = !isScheduleTba && (data.is_recurring === true || Boolean(recurringPattern));

    const prefill: Record<string, any> = {
        title: textValue(data.title),
        description: textValue(data.description),
        address: textValue(data.address),
        latitude: data.latitude ?? '',
        longitude: data.longitude ?? '',
        season_start_date: textValue(data.season_start_date),
        season_end_date: textValue(data.season_end_date),
        start_time: textValue(data.start_time),
        end_time: textValue(data.end_time),
        application_start_date: textValue(data.application_start_date),
        application_end_date: textValue(data.application_end_date),
        additional_schedules: normalizeSchedules(data.additional_schedules),
        is_indoors: data.is_indoors === true,
        electricity_access: data.electricity_access === true,
        booth_size: textValue(data.booth_size),
        is_schedule_tba: isScheduleTba,
        application_deadline: textValue(data.application_deadline),
        vendor_count: numberValue(data.vendor_count),
        admission_fee: numberValue(data.admission_fee),
        website: textValue(data.website),
        is_trending: data.is_trending === true,
        tags: normalizeTags(data.tags),
        categories: normalizeCategories(data.categories),
        is_recurring: isRecurring,
        recurring_pattern: recurringPattern || null,
        organizer_name: textValue(data.organizer_name)
    };

    if (Array.isArray(data.admission_fees) && data.admission_fees.length > 0) {
        prefill.admission_fees = data.admission_fees.map(fee => ({
            label: textValue(fee.label),
            price: numberValue(fee.price)
        }));
    }

    return prefill;
};

const MarketImportForm = ({ onSuccess }: MarketImportFormProps) => {
    const [rawText, setRawText] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draft, setDraft] = useState<Record<string, any> | null>(null);
    const [missingRequired, setMissingRequired] = useState<string[]>([]);

    const handleParse = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!rawText.trim() && !screenshot) {
            setError('Paste market text or provide a screenshot.');
            return;
        }

        if (screenshot && screenshot.size > 6_000_000) {
            setError('Screenshot is too large. Please keep it under 6MB.');
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('text', rawText.trim());
            if (sourceUrl.trim()) {
                formData.append('source_url', sourceUrl.trim());
            }
            if (screenshot) {
                formData.append('screenshot', screenshot);
            }

            const res = await fetch('/api/market-import', {
                method: 'POST',
                body: formData
            });

            const payload = await res.json();
            if (!res.ok || !payload?.success) {
                throw new Error(payload?.error || 'Failed to parse the market info.');
            }

            const parsed = payload.data as ParsedMarket;
            const prefill = buildPrefill(parsed);

            const missing: string[] = [];
            if (!prefill.title) missing.push('Event Title');
            if (!prefill.address) missing.push('Address');

            setMissingRequired(missing);
            setDraft(prefill);
        } catch (parseError) {
            console.error(parseError);
            setError(parseError instanceof Error ? parseError.message : 'Parsing failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <form onSubmit={handleParse} className="space-y-6">
                <div className="flex items-center gap-2 text-amber-300">
                    <Sparkles size={18} />
                    <h2 className="text-lg font-bold">AI Market Import</h2>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Paste Market Info</label>
                    <textarea
                        name="rawText"
                        rows={6}
                        value={rawText}
                        onChange={e => setRawText(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500 outline-none transition-colors"
                        placeholder="Paste event details, flyers, social posts, or website copy..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Source Link (Optional)</label>
                        <input
                            type="url"
                            name="source_url"
                            value={sourceUrl}
                            onChange={e => setSourceUrl(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 outline-none transition-colors"
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Screenshot (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => setScreenshot(e.target.files?.[0] || null)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white"
                        />
                    </div>
                </div>

                {error ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </div>
                ) : null}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-900/20 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                    {isLoading ? 'Analyzing...' : 'Parse & Prefill Market'}
                </button>
            </form>

            {draft ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-amber-300">Review & Edit</h3>
                        <button
                            type="button"
                            onClick={() => {
                                setDraft(null);
                                setMissingRequired([]);
                            }}
                            className="text-sm text-white/50 hover:text-white/80 transition-colors"
                        >
                            Clear draft
                        </button>
                    </div>

                    {missingRequired.length > 0 ? (
                        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-amber-200">
                            <div className="text-sm font-semibold">Missing required fields</div>
                            <div className="text-sm text-amber-200/80">
                                {missingRequired.join(', ')}. Please fill these before saving.
                            </div>
                        </div>
                    ) : null}

                    <MarketForm
                        initialData={draft}
                        onSuccess={() => {
                            setDraft(null);
                            setMissingRequired([]);
                            onSuccess?.();
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
};

export default MarketImportForm;
