'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Store, ShoppingBag, LogOut, Upload, FileJson, LayoutList } from 'lucide-react';
import MarketForm from '@/components/admin/MarketForm';
import ConsignmentForm from '@/components/admin/ConsignmentForm';
import JsonImportForm from '@/components/admin/JsonImportForm';
import OpportunityList from '@/components/admin/OpportunityList';

// Tabs
const TABS = {
    MANAGE: 'MANAGE',
    MARKET: 'MARKET',
    CONSIGNMENT: 'CONSIGNMENT',
    IMPORT: 'IMPORT'
};

const AdminDashboard = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(TABS.MANAGE);
    const [editingItem, setEditingItem] = useState<any>(null);

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

    const handleEdit = (item: any) => {
        setEditingItem(item);
        if (item.type === 'MARKET') setActiveTab(TABS.MARKET);
        else if (item.type === 'CONSIGNMENT') setActiveTab(TABS.CONSIGNMENT);
    };

    const handleSuccess = () => {
        setEditingItem(null);
        setActiveTab(TABS.MANAGE);
    };

    // Clear editing state if user manually switches tabs (optional, but good UX)
    const handleTabChange = (tab: string) => {
        setEditingItem(null);
        setActiveTab(tab);
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
                <div className="flex gap-4 mb-6 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => handleTabChange(TABS.MANAGE)}
                        className={`flex-1 min-w-[120px] py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${activeTab === TABS.MANAGE
                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        <LayoutList size={24} />
                        <span className="font-bold tracking-wide text-xs md:text-sm">MANAGE</span>
                    </button>
                    <button
                        onClick={() => handleTabChange(TABS.MARKET)}
                        className={`flex-1 min-w-[120px] py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${activeTab === TABS.MARKET
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/40'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        <Store size={24} />
                        <span className="font-bold tracking-wide text-xs md:text-sm">{editingItem?.type === 'MARKET' ? 'EDIT MARKET' : 'ADD MARKET'}</span>
                    </button>
                    <button
                        onClick={() => handleTabChange(TABS.CONSIGNMENT)}
                        className={`flex-1 min-w-[120px] py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${activeTab === TABS.CONSIGNMENT
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        <ShoppingBag size={24} />
                        <span className="font-bold tracking-wide text-xs md:text-sm">{editingItem?.type === 'CONSIGNMENT' ? 'EDIT SHOP' : 'ADD SHOP'}</span>
                    </button>
                    <button
                        onClick={() => handleTabChange(TABS.IMPORT)}
                        className={`flex-1 min-w-[120px] py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${activeTab === TABS.IMPORT
                            ? 'bg-violet-600 border-violet-400 text-white shadow-lg shadow-violet-900/40'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        <Upload size={24} />
                        <span className="font-bold tracking-wide text-xs md:text-sm">IMPORT</span>
                    </button>
                </div>

                {/* Form Container */}
                <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-500
                        ${activeTab === TABS.MARKET ? 'bg-indigo-500/10' :
                            activeTab === TABS.CONSIGNMENT ? 'bg-emerald-500/10' :
                                activeTab === TABS.MANAGE ? 'bg-blue-500/10' : 'bg-violet-500/10'}`}
                    />

                    {activeTab === TABS.MANAGE && (
                        <div className="animate-fade-in">
                            <OpportunityList onEdit={handleEdit} />
                        </div>
                    )}

                    {activeTab === TABS.MARKET && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl font-bold mb-6 text-indigo-400 flex items-center gap-2">
                                <Plus size={20} />
                                {editingItem ? 'Edit Market Listing' : 'New Market Listing'}
                            </h2>
                            <MarketForm initialData={editingItem} onSuccess={handleSuccess} />
                        </div>
                    )}

                    {activeTab === TABS.CONSIGNMENT && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
                                <Plus size={20} />
                                {editingItem ? 'Edit Shop Listing' : 'New Shop Listing'}
                            </h2>
                            <ConsignmentForm initialData={editingItem} onSuccess={handleSuccess} />
                        </div>
                    )}

                    {activeTab === TABS.IMPORT && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl font-bold mb-6 text-violet-400 flex items-center gap-2">
                                <FileJson size={20} />
                                Bulk Data Import
                            </h2>
                            <JsonImportForm />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
