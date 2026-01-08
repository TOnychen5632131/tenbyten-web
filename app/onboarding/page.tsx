import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import { Loader2, Upload, Plus, Trash2, Info, ShieldCheck, DollarSign } from 'lucide-react';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, profile, loading: authLoading } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Form State
    const [brandName, setBrandName] = useState('');
    const [description, setDescription] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    // Start with 3 empty slots, or load from profile
    const [markets, setMarkets] = useState<string[]>(['', '', '']);
    const [marketError, setMarketError] = useState('');
    const minimumMarkets = 3;

    const priceRanges = [
        'Under $50',
        '$50 - $100',
        '$100 - $200',
        '$200+',
        'Any'
    ];

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        // Pre-fill if profile exists
        if (profile) {
            setIsEditMode(true);
            setBrandName(profile.brand_name || '');
            setDescription(profile.product_description || '');
            setPriceRange(profile.preferred_price_range || '');
            if (profile.avatar_url) {
                setAvatarPreview(profile.avatar_url);
            }
            if (profile.top_markets && profile.top_markets.length > 0) {
                const nextMarkets = [...profile.top_markets];
                while (nextMarkets.length < minimumMarkets) {
                    nextMarkets.push('');
                }
                setMarkets(nextMarkets);
            }
        }
    }, [user, profile, authLoading, router, minimumMarkets]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleMarketChange = (index: number, value: string) => {
        const newMarkets = [...markets];
        newMarkets[index] = value;
        setMarkets(newMarkets);
        if (marketError) {
            const validCount = newMarkets.filter(m => m.trim() !== '').length;
            if (validCount >= minimumMarkets) {
                setMarketError('');
            }
        }
    };

    const addMarketSlot = () => {
        setMarkets([...markets, '']);
    };

    const removeMarketSlot = (index: number) => {
        if (markets.length <= minimumMarkets) return;
        const newMarkets = markets.filter((_, i) => i !== index);
        setMarkets(newMarkets);
        if (marketError) {
            const validCount = newMarkets.filter(m => m.trim() !== '').length;
            if (validCount >= minimumMarkets) {
                setMarketError('');
            }
        }
    };

    const uploadAvatar = async (userId: string): Promise<string | null> => {
        if (!avatarFile) return null;

        // Create a unique file name to avoid browser caching issues on update
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatar-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);

        try {
            let avatarUrl = avatarPreview; // Default to existing

            // If new file selected, upload it
            if (avatarFile) {
                avatarUrl = await uploadAvatar(user.id);
            }

            // Fallback if no avatar exists at all
            if (!avatarUrl) {
                console.log('Using fallback avatar (Dicebear)');
                avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${brandName}`;
            }

            const validMarkets = markets.filter(m => m.trim() !== '');
            if (validMarkets.length < minimumMarkets) {
                setMarketError(`Please add at least ${minimumMarkets} favorite markets to continue.`);
                setSubmitting(false);
                return;
            }

            if (!priceRange) {
                alert('Please select a preferred stall price range.');
                setSubmitting(false);
                return;
            }

            const { error } = await supabase
                .from('vendor_profiles')
                .upsert({
                    id: user.id,
                    brand_name: brandName,
                    product_description: description, // Now optional
                    avatar_url: avatarUrl,
                    top_markets: validMarkets,
                    preferred_price_range: priceRange,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Reload to reflect changes or redirect home
            window.location.href = '/';

        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 py-20">
            <div className="w-full max-w-2xl animate-fade-in relative z-10">
                <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tighter">
                    {isEditMode ? 'Vendor Settings' : 'Welcome to Tenbyten'}
                </h1>
                <p className="text-white/60 mb-8 text-lg">
                    {isEditMode ? 'Update your brand details and preferences.' : "Let's set up your vendor profile."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Avatar Upload (Optional) */}
                    <div className="flex flex-col items-center gap-4 p-6 border border-dashed border-white/20 rounded-2xl bg-white/5 transition-colors hover:bg-white/10">
                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border-2 border-white/20 shadow-xl">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Upload size={32} className="text-white/40" />
                            )}
                        </div>
                        <label className="cursor-pointer px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 text-sm">
                            {isEditMode ? 'Change Avatar' : 'Upload Logo / Avatar (Optional)'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </label>
                    </div>

                    {/* Text Fields */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-white/50 uppercase tracking-widest ml-1">Brand Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                className="w-full bg-transparent border-b border-white/20 py-3 text-xl md:text-2xl font-bold focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-white/20"
                                placeholder="My Awesome Brand"
                            />
                        </div>

                        {/* Price Range */}
                        <div className="space-y-3">
                            <label className="text-xs font-mono text-white/50 uppercase tracking-widest ml-1">Preferred Stall Price Range <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {priceRanges.map((range) => (
                                    <button
                                        key={range}
                                        type="button"
                                        onClick={() => setPriceRange(range)}
                                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${priceRange === range
                                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-white/40 ml-1">
                                <Info size={12} />
                                <span>We highlight stalls with similar prices to your preference.</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono text-white/50 uppercase tracking-widest ml-1">What do you sell? (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-base focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all h-24 resize-none placeholder:text-white/20"
                                placeholder="Describe your products, style, and story..."
                            />
                        </div>
                    </div>

                    {/* Top Markets - Dynamic List */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-mono text-white/50 uppercase tracking-widest ml-1">Favorite Markets <span className="text-red-500">*</span></label>

                            {/* Verification Warning Banner */}
                            <div className="p-4 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-white/10 rounded-xl space-y-3 mb-2">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck size={20} className="text-blue-300 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-200 mb-1">Verify you are a real person</h4>
                                        <p className="text-xs text-blue-200/70 leading-relaxed">
                                            To ensure our platform serves genuine vendors with real needs, we require you to list at least 3 markets you frequent.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                                    <Info size={20} className="text-purple-300 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-purple-200/70 leading-relaxed">
                                            This also helps our AI recommend venues where your brand would thrive.
                                            <strong className="text-purple-200 ml-1">The more you add, the more precise the recommendations.</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {markets.map((market, index) => (
                                <div key={index} className="flex gap-2 items-center group animate-fade-in-up">
                                    <span className="flex items-center justify-center w-8 h-10 text-white/30 font-mono text-sm">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </span>
                                    <input
                                        type="text"
                                        value={market}
                                        onChange={(e) => handleMarketChange(index, e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/20"
                                        placeholder={index === 0 ? "Fremont Sunday Market" : "Another Market"}
                                        required={index < minimumMarkets}
                                        autoFocus={index === markets.length - 1 && index > 2}
                                    />
                                    {markets.length > minimumMarkets && (
                                        <button
                                            type="button"
                                            onClick={() => removeMarketSlot(index)}
                                            className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {marketError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {marketError}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={addMarketSlot}
                            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1"
                        >
                            <Plus size={16} />
                            Add another market
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-lg disabled:opacity-50 shadow-lg shadow-white/5"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : (isEditMode ? 'Update Profile' : 'Complete Setup')}
                    </button>

                </form>
            </div>
        </div>
    );
}

