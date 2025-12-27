
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, Percent } from 'lucide-react';

interface ConsignmentFormProps {
    initialData?: any;
    onSuccess?: () => void;
}

const ConsignmentForm: React.FC<ConsignmentFormProps> = ({ initialData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '', // This was missing in JSX but present in state
        address: '',
        accepted_items: '', // comma separated in UI
        excluded_brands: '', // comma separated
        consignment_split: '',
        contract_duration_days: '',
        intake_hours: '',
        open_days: [], // TODO: Multi-select logic
        website: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                address: initialData.address || '',
                accepted_items: Array.isArray(initialData.accepted_items) ? initialData.accepted_items.join(', ') : '',
                excluded_brands: Array.isArray(initialData.excluded_brands) ? initialData.excluded_brands.join(', ') : '',
                consignment_split: initialData.consignment_split || '',
                contract_duration_days: initialData.contract_duration_days || '',
                intake_hours: initialData.intake_hours || '',
                open_days: initialData.open_days || [],
                website: initialData.website || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Transform comma separated strings to arrays
            const payload = {
                ...formData,
                type: 'CONSIGNMENT',
                accepted_items: formData.accepted_items.split(',').map(s => s.trim()),
                excluded_brands: formData.excluded_brands.split(',').map(s => s.trim())
            };

            const method = initialData ? 'PUT' : 'POST';
            const body = initialData ? { ...payload, id: initialData.id } : payload;

            const res = await fetch('/api/opportunities', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                alert(`Shop ${initialData ? 'updated' : 'saved'} successfully!`);
                if (onSuccess) onSuccess();
            } else {
                alert('Failed to save.');
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting form.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Shop Name</label>
                    <input name="title" value={formData.title} required onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="e.g. Trendy Thrift Store" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Description</label>
                    <textarea name="description" value={formData.description} rows={3} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="Describe the shop..." />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Address</label>
                    <input name="address" value={formData.address} required onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="456 Main St" />
                </div>
            </div>

            {/* Consignment Rules */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Percent size={16} className="text-emerald-400" />
                    Terms & Money
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase text-white/40 mb-1">Split (e.g. 50/50)</label>
                        <input name="consignment_split" value={formData.consignment_split} onChange={handleChange} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm" placeholder="50/50" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-white/40 mb-1">Contract Days</label>
                        <input type="number" name="contract_duration_days" value={formData.contract_duration_days} onChange={handleChange} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm" placeholder="60" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase text-white/40 mb-1">Accepted Items (Comma separated)</label>
                        <input name="accepted_items" value={formData.accepted_items} onChange={handleChange} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm" placeholder="Clothing, Shoes, Handbags..." />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase text-white/40 mb-1">Excluded Brands (Comma separated)</label>
                        <input name="excluded_brands" value={formData.excluded_brands} onChange={handleChange} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm" placeholder="SHEIN, Forever 21..." />
                    </div>
                </div>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-emerald-400" />
                    Intake Hours
                </h3>
                <div>
                    <input name="intake_hours" value={formData.intake_hours} onChange={handleChange} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm" placeholder="e.g. Tuesdays & Thursdays 10am - 2pm only" />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.99] disabled:opacity-50"
            >
                {loading ? 'Saving...' : (initialData ? 'Update Shop' : 'Create Consignment Shop')}
            </button>
        </form>
    );
};

export default ConsignmentForm;
