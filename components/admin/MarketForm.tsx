
import React, { useState, useEffect } from 'react';
import { Upload, Calendar, MapPin, Clock } from 'lucide-react';

interface MarketFormProps {
    initialData?: any;
    onSuccess?: () => void;
}

const MarketForm: React.FC<MarketFormProps> = ({ initialData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        season_start_date: '',
        season_end_date: '',
        start_time: '',
        end_time: '',
        is_indoors: false,
        electricity_access: false,
        booth_size: '',
        application_deadline: '',
        vendor_count: '',
        admission_fee: '',
        website: '',
        tags: '',
        categories: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                address: initialData.address || '',
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
                website: initialData.website || '',
                // Join arrays for string editing
                tags: initialData.tags ? initialData.tags.join(', ') : '',
                categories: initialData.categories ? initialData.categories.join(', ') : ''
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
                categories: formData.categories.split(',').map(s => s.trim()).filter(Boolean)
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
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input name="address" value={formData.address} required onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition-colors" placeholder="123 Market St, Los Angeles, CA" />
                    </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase text-white/40 mb-1">Tags / Food Access</label>
                        <input name="tags" value={formData.tags} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="e.g. WIC, SNAP, Organic (comma separated)" />
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
