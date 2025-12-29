import React, { useState, useEffect } from 'react';
import { Upload, Calendar, MapPin, Clock, User, Flame } from 'lucide-react';

interface MarketFormProps {
    initialData?: any;
    onSuccess?: () => void;
}

const formatCoordinate = (value: any) => {
    if (value === null || value === undefined) return '';
    const num = Number(value);
    if (!Number.isFinite(num) || num === 0) return '';
    return String(value);
};

const MarketForm: React.FC<MarketFormProps> = ({ initialData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
        season_start_date: '2026-01-01',
        season_end_date: '2026-12-31',
        start_time: '',
        end_time: '',
        is_indoors: false,
        electricity_access: false,
        booth_size: '',
        application_deadline: '',
        vendor_count: '',
        admission_fee: '',
        website: '',
        is_trending: false,
        tags: '',
        categories: '',
        is_recurring: false,
        recurring_days: [] as string[],
        recurring_frequency: 'Weekly', // 'Weekly' | 'Monthly'
        recurring_ordinal: '1st',      // '1st', '2nd', '3rd', '4th', 'Last'
        organizer_name: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                address: initialData.address || '',
                latitude: formatCoordinate(initialData.latitude),
                longitude: formatCoordinate(initialData.longitude),
                // Use season dates if available, fallback to legacy start/end or empty
                season_start_date: initialData.season_start_date || initialData.start_date || '',
                season_end_date: initialData.season_end_date || initialData.end_date || '',
                // Ensure time is in HH:MM format for input[type="time"]
                start_time: initialData.start_time ? initialData.start_time.slice(0, 5) : '',
                end_time: initialData.end_time ? initialData.end_time.slice(0, 5) : '',
                is_indoors: initialData.is_indoors || false,
                electricity_access: initialData.electricity_access || false,
                booth_size: initialData.booth_size || '',
                application_deadline: initialData.application_deadline || '',
                vendor_count: initialData.vendor_count || '',
                admission_fee: initialData.admission_fee || '',
                website: initialData.website || initialData.application_link || '',
                is_trending: initialData.is_trending || false, // Added this line
                // Join arrays for string editing
                tags: initialData.tags ? initialData.tags.join(', ') : '',
                categories: initialData.categories ? initialData.categories.join(', ') : '',
                is_recurring: initialData.is_recurring || false,
                recurring_days: initialData.recurring_pattern
                    ? (initialData.recurring_pattern.includes('Weekly')
                        ? initialData.recurring_pattern.replace('Weekly on ', '').split(', ').filter(Boolean)
                        : [initialData.recurring_pattern.split(' ').pop()]) // "Monthly on the 3rd Saturday" -> "Saturday"
                    : [],
                recurring_frequency: initialData.recurring_pattern && initialData.recurring_pattern.includes('Monthly') ? 'Monthly' : 'Weekly',
                recurring_ordinal: initialData.recurring_pattern && initialData.recurring_pattern.includes('Monthly')
                    ? initialData.recurring_pattern.split(' ')[3] // "Monthly on the [3rd] Saturday"
                    : '1st',
                organizer_name: initialData.organizer_name || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const method = initialData ? 'PUT' : 'POST';
            const body = {
                type: 'MARKET',
                ...formData,
                id: initialData?.id, // Include ID for updates
                // Split strings back to arrays
                tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
                categories: (() => {
                    let cats = formData.categories.split(',').map(s => s.trim()).filter(Boolean);
                    if (formData.is_recurring && formData.recurring_days.length > 0) {
                        formData.recurring_days.forEach(day => {
                            if (!cats.includes(day)) cats.push(day);
                        });
                    }
                    return cats;
                })(),
                is_recurring: formData.is_recurring,
                recurring_pattern: formData.is_recurring
                    ? (formData.recurring_frequency === 'Weekly' && formData.recurring_days.length > 0
                        ? `Weekly on ${formData.recurring_days.join(', ')}`
                        : (formData.recurring_frequency === 'Monthly' && formData.recurring_days.length > 0
                            ? `Monthly on the ${formData.recurring_ordinal} ${formData.recurring_days[0]}`
                            : null)
                    )
                    : null
            };

            const res = await fetch('/api/opportunities', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                alert(`Market ${initialData ? 'updated' : 'saved'} successfully!`);
                if (onSuccess) onSuccess();
            } else {
                const err = await res.json();
                alert(`Failed to save: ${err.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting form.');
        } finally {
            setLoading(false);
        }
    };

    const toggleTag = (tag: string) => {
        const currentTags = formData.tags.split(',').map(s => s.trim()).filter(Boolean);
        let newTags;
        if (currentTags.includes(tag)) {
            newTags = currentTags.filter(t => t !== tag);
        } else {
            newTags = [...currentTags, tag];
        }
        setFormData(prev => ({ ...prev, tags: newTags.join(', ') }));
    };

    const toggleDay = (day: string) => {
        setFormData(prev => {
            const currentDays = prev.recurring_days || [];
            if (currentDays.includes(day)) {
                return { ...prev, recurring_days: currentDays.filter(d => d !== day) };
            } else {
                return { ...prev, recurring_days: [...currentDays, day] };
            }
        });
    };

    const PRESET_TAGS = [
        'Farm', 'Processor', 'Craft', 'Vintage', 'Importer',
        'Hot Food', 'Booth', 'Food Truck', 'Non-Profit', 'Community'
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Event Title</label>
                    <input name="title" value={formData.title} required onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors" placeholder="e.g. Summer Vintage Market" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Description</label>
                    <textarea name="description" value={formData.description} rows={4} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors" placeholder="Describe the vibe, products, and audience..." />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Hosted By</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input name="organizer_name" value={formData.organizer_name} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition-colors" placeholder="e.g. Seattle Farmers Market Association" />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input name="address" value={formData.address} required onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition-colors" placeholder="123 Market St, Los Angeles, CA" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Latitude (Optional)</label>
                    <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors"
                        placeholder="47.6062"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Longitude (Optional)</label>
                    <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors"
                        placeholder="-122.3321"
                    />
                </div>
                <div className="md:col-span-2 text-[10px] text-white/40">
                    Leave both blank to auto-fill coordinates from the address.
                </div>
            </div>

            {/* Date & Time Section */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-400" />
                    Date & Time
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase text-white/40 mb-1">Season Start</label>
                        <input type="date" name="season_start_date" value={formData.season_start_date} onChange={handleChange} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-white/40 mb-1">Season End</label>
                        <input type="date" name="season_end_date" value={formData.season_end_date} onChange={handleChange} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-white/40 mb-1">Open Time</label>
                        <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-white/40 mb-1">Close Time</label>
                        <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm" />
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <input
                            type="checkbox"
                            name="is_recurring"
                            checked={formData.is_recurring}
                            onChange={handleChange}
                            className="w-4 h-4 rounded text-blue-500"
                        />
                        <span className="text-sm font-bold text-white">Example: Recurring Weekly Event?</span>
                    </div>

                    {formData.is_recurring && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-4 mb-2">
                                <div>
                                    <label className="block text-[10px] uppercase text-white/40 mb-1">Frequency</label>
                                    <select
                                        name="recurring_frequency"
                                        value={formData.recurring_frequency}
                                        onChange={handleChange}
                                        className="bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                                    >
                                        <option value="Weekly">Weekly</option>
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>
                                {formData.recurring_frequency === 'Monthly' && (
                                    <div>
                                        <label className="block text-[10px] uppercase text-white/40 mb-1">Ordinal</label>
                                        <select
                                            name="recurring_ordinal"
                                            value={formData.recurring_ordinal}
                                            onChange={handleChange}
                                            className="bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                                        >
                                            <option value="1st">1st</option>
                                            <option value="2nd">2nd</option>
                                            <option value="3rd">3rd</option>
                                            <option value="4th">4th</option>
                                            <option value="Last">Last</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase text-white/40 mb-2">
                                    {formData.recurring_frequency === 'Monthly' ? 'Day' : 'Day(s) of Week'}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => {
                                                if (formData.recurring_frequency === 'Monthly') {
                                                    // Monthly only supports single day selection for simplicity
                                                    setFormData(prev => ({ ...prev, recurring_days: [day] }));
                                                } else {
                                                    toggleDay(day);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.recurring_days.includes(day)
                                                ? 'bg-blue-600 text-white border-blue-500'
                                                : 'bg-black/30 text-white/50 border-white/10 hover:text-white'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-end pt-2">
                                <span className="text-xs text-blue-400">
                                    {formData.recurring_frequency === 'Monthly'
                                        ? `* Result: Monthly on the ${formData.recurring_ordinal} ${formData.recurring_days[0] || '...'}`
                                        : '* Will auto-add selected days to Categories'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Logistics */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4">Logistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                        <input type="checkbox" name="is_indoors" checked={formData.is_indoors} onChange={handleChange} className="w-4 h-4 rounded text-blue-500" />
                        <span className="text-sm text-white/80">Indoors?</span>
                    </div>
                    <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                        <input type="checkbox" name="electricity_access" checked={formData.electricity_access} onChange={handleChange} className="w-4 h-4 rounded text-blue-500" />
                        <span className="text-sm text-white/80">Has Power?</span>
                    </div>
                    <div>
                        <input name="booth_size" value={formData.booth_size} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="Booth Size (e.g. 10x10)" />
                    </div>
                    <div>
                        <input name="admission_fee" value={formData.admission_fee} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="Admission Fee ($)" />
                    </div>
                    <div>
                        <input name="vendor_count" value={formData.vendor_count} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="Vendor Count" />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-[10px] uppercase text-white/40 mb-2">Application Link (Optional)</label>
                    <div className="relative">
                        <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 pl-10 text-white text-sm focus:border-blue-500 outline-none transition-colors max-w-full"
                            placeholder="https://..."
                        />
                    </div>
                    <p className="text-[10px] text-white/30 mt-1 pl-1">* If set, "Apply for Booth" will link here. Otherwise, it searches Google.</p>
                </div>

                {/* Trending / Featured Toggle */}
                <div className="mb-8 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-orange-400 flex items-center gap-2">
                            <Flame size={16} fill="currentColor" />
                            Upcoming / Trending
                        </h4>
                        <p className="text-[10px] text-white/50 mt-1">
                            Add to "Trending Markets" list & display <span className="text-orange-400 font-bold">HOT</span> badge
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.is_trending}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_trending: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase text-white/40 mb-2">Vendor Types (Click to add)</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {PRESET_TAGS.map(tag => {
                                const isActive = formData.tags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${isActive
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30 hover:text-white'
                                            }`}
                                    >
                                        #{tag}
                                    </button>
                                );
                            })}
                        </div>
                        <input
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm"
                            placeholder="e.g. Farm, Craft (Type or select above)"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-white/40 mb-1">Categories / Market Day</label>
                        <input name="categories" value={formData.categories} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="e.g. Saturday, Produce, Crafts" />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.99] disabled:opacity-50"
            >
                {loading ? 'Saving...' : (initialData ? 'Update Market' : 'Create Market Opportunity')}
            </button>
        </form>
    );
};

export default MarketForm;
