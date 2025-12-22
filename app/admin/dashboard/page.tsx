'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Store, ShoppingBag, LogOut } from 'lucide-react';
import MarketForm from '@/components/admin/MarketForm';
import ConsignmentForm from '@/components/admin/ConsignmentForm';

// Tabs
const TABS = {
    MARKET: 'MARKET',
    CONSIGNMENT: 'CONSIGNMENT'
};

const AdminDashboard = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(TABS.MARKET);

    // Simple auth check
    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            router.push('/admin-login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        router.push('/admin-login');
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            {/* Header */}
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-white/50">Manage Sales Opportunities</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/10"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab(TABS.MARKET)}
                        className={`flex-1 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${activeTab === TABS.MARKET
                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        <Store size={24} />
                        <span className="font-bold tracking-wide">ADD MARKET</span>
                    </button>
                    <button
                        onClick={() => setActiveTab(TABS.CONSIGNMENT)}
                        className={`flex-1 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${activeTab === TABS.CONSIGNMENT
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        <ShoppingBag size={24} />
                        <span className="font-bold tracking-wide">ADD SHOP</span>
                    </button>
                </div>

                {/* Form Container */}
                <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    {activeTab === TABS.MARKET ? (
                        <div className="animate-fade-in">
                            <h2 className="text-xl font-bold mb-6 text-blue-400 flex items-center gap-2">
                                <Plus size={20} />
                                New Market Listing
                            </h2>
                            <MarketForm />
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <h2 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
                                <Plus size={20} />
                                New Shop Listing
                            </h2>
                            <ConsignmentForm />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
