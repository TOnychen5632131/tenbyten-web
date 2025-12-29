import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { User, AlignLeft, MapPin, Image as ImageIcon } from 'lucide-react';

interface VendorProfileFormProps {
    initialData?: any;
    onSuccess?: () => void;
}

const VendorProfileForm: React.FC<VendorProfileFormProps> = ({ initialData, onSuccess }) => {
    // const supabase = createClientComponentClient(); // Removed
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        brand_name: '',
        product_description: '',
        avatar_url: '',
        top_markets: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                brand_name: initialData.brand_name || '',
                product_description: initialData.product_description || '',
                avatar_url: initialData.avatar_url || '',
                top_markets: initialData.top_markets ? initialData.top_markets.join(', ') : ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updates = {
                brand_name: formData.brand_name,
                product_description: formData.product_description,
                avatar_url: formData.avatar_url,
                top_markets: formData.top_markets.split(',').map(s => s.trim()).filter(Boolean),
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('vendor_profiles')
                .update(updates)
                .eq('id', initialData.id);

            if (error) throw error;

            if (onSuccess) onSuccess();
            alert('Profile updated successfully!');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(`Error: ${error.message}`);
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
            <div className="space-y-4">
                <div>
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Brand Name</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            name="brand_name"
                            value={formData.brand_name}
                            onChange={handleChange}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition-colors"
                            placeholder="Vendor Brand Name"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Product Description</label>
                    <div className="relative">
                        <div className="absolute left-4 top-4 text-white/30">
                            <AlignLeft size={18} />
                        </div>
                        <textarea
                            name="product_description"
                            value={formData.product_description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition-colors"
                            placeholder="Describe the products..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Avatar URL</label>
                    <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            name="avatar_url"
                            value={formData.avatar_url}
                            onChange={handleChange}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition-colors"
                            placeholder="https://..."
                        />
                    </div>
                    {formData.avatar_url && (
                        <div className="mt-2 text-center bg-white/5 rounded-xl p-2">
                            <img src={formData.avatar_url} alt="Preview" className="w-16 h-16 rounded-full mx-auto object-cover" />
                            <p className="text-[10px] text-white/40 mt-1">Preview</p>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Top Markets</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            name="top_markets"
                            value={formData.top_markets}
                            onChange={handleChange}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition-colors"
                            placeholder="Market A, Market B (comma separated)"
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.99] disabled:opacity-50"
            >
                {loading ? 'Saving...' : 'Update Vendor Profile'}
            </button>
        </form>
    );
};

export default VendorProfileForm;
