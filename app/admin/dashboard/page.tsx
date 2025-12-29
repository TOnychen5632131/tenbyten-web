'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Store, ShoppingBag, LogOut, Upload, FileJson, LayoutList, User, Database } from 'lucide-react';
import MarketForm from '@/components/admin/MarketForm';
import ConsignmentForm from '@/components/admin/ConsignmentForm';
import JsonImportForm from '@/components/admin/JsonImportForm';
import OpportunityList from '@/components/admin/OpportunityList';
import UserList from '@/components/admin/UserList';
import AdminDrawer from '@/components/admin/AdminDrawer';
import VendorProfileForm from '@/components/admin/VendorProfileForm';

// Tabs
const TABS = {
    MANAGE: 'MANAGE',
    MARKET: 'MARKET',
    CONSIGNMENT: 'CONSIGNMENT',
    IMPORT: 'IMPORT',
    USERS: 'USERS'
};

const AdminDashboard = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(TABS.MANAGE);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
        setIsDrawerOpen(true);
    };

    const handleSuccess = () => {
        setEditingItem(null);
        setIsDrawerOpen(false);
        // Force refresh logic could be added here if OpportunityList listened to a context or event
        // For now, the user can manually refresh or we can add a refresh trigger prop
        window.location.reload(); // Simple reload to reflect changes
    };

    const handleNewMarket = () => {
        setEditingItem(null); // Clear editing item implies "New"
        setActiveTab(TABS.MARKET);
    };

    const handleNewShop = () => {
        setEditingItem(null);
        setActiveTab(TABS.CONSIGNMENT);
    };

    // Clear editing state if user manually switches tabs (optional, but good UX)
    const handleTabChange = (tab: string) => {
        setEditingItem(null);
        setActiveTab(tab);
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            {/* Header */}
            <div className="max-w-[1400px] mx-auto flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-white/50">Manage Sales Opportunities</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleNewMarket}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-sm font-bold transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={16} />
                        New Market
                    </button>
                    <button
                        onClick={handleNewShop}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-sm font-bold transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        <Plus size={16} />
                        New Shop
                    </button>
                    <div className="h-8 w-[1px] bg-white/10 mx-2" />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/10"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                {/* Sidebar Navigation (Tabs replacement) */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => handleTabChange(TABS.MANAGE)}
                        className={`text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === TABS.MANAGE
                            ? 'bg-white/10 text-white font-bold border border-white/10'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <LayoutList size={20} />
                        Manage Listings
                    </button>
                    <button
                        onClick={() => handleTabChange(TABS.MARKET)}
                        className={`text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === TABS.MARKET
                            ? 'bg-white/10 text-white font-bold border border-white/10'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Store size={20} />
                        Add Market
                    </button>
                    <button
                        onClick={() => handleTabChange(TABS.CONSIGNMENT)}
                        className={`text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === TABS.CONSIGNMENT
                            ? 'bg-white/10 text-white font-bold border border-white/10'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <ShoppingBag size={20} />
                        Add Shop
                    </button>
                    <button
                        onClick={() => handleTabChange(TABS.IMPORT)}
                        className={`text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === TABS.IMPORT
                            ? 'bg-white/10 text-white font-bold border border-white/10'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Upload size={20} />
                        Import Data
                    </button>
                    <button
                        onClick={() => handleTabChange(TABS.USERS)}
                        className={`text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === TABS.USERS
                            ? 'bg-white/10 text-white font-bold border border-white/10'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <User size={20} />
                        Manage Users
                    </button>

                    <div className="h-[1px] bg-white/10 my-2 mx-4" />

                    <a
                        href="/api/admin/backup"
                        download
                        className="text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-white/50 hover:bg-white/5 hover:text-white"
                    >
                        <Database size={20} />
                        Backup Database
                    </a>
                </div>

                {/* Content Panel */}
                <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden min-h-[600px]">
                    {/* Dynamic Background */}
                    <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-500 opacity-20
                        ${activeTab === TABS.MARKET ? 'bg-blue-500' :
                            activeTab === TABS.CONSIGNMENT ? 'bg-emerald-500' :
                                activeTab === TABS.USERS ? 'bg-pink-500' :
                                    activeTab === TABS.MANAGE ? 'bg-white' : 'bg-violet-500'}`}
                    />

                    {activeTab === TABS.MANAGE && (
                        <div className="animate-fade-in relative z-10">
                            <OpportunityList onEdit={handleEdit} />
                        </div>
                    )}

                    {activeTab === TABS.MARKET && (
                        <div className="animate-fade-in relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                                <Plus size={24} className="text-blue-500" />
                                Create New Market
                            </h2>
                            <MarketForm initialData={null} onSuccess={() => setActiveTab(TABS.MANAGE)} />
                        </div>
                    )}

                    {activeTab === TABS.CONSIGNMENT && (
                        <div className="animate-fade-in relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                                <Plus size={24} className="text-emerald-500" />
                                Create New Consignment Shop
                            </h2>
                            <ConsignmentForm initialData={null} onSuccess={() => setActiveTab(TABS.MANAGE)} />
                        </div>
                    )}

                    {activeTab === TABS.IMPORT && (
                        <div className="animate-fade-in relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                                <FileJson size={24} className="text-violet-500" />
                                Bulk Data Import
                            </h2>
                            <JsonImportForm />
                        </div>
                    )}

                    {activeTab === TABS.USERS && (
                        <div className="animate-fade-in relative z-10">
                            <UserList onEdit={handleEdit} />
                        </div>
                    )}
                </div>
            </div>

            {/* Side Drawer for Editing */}
            <AdminDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={editingItem ? `Edit ${editingItem.title}` : 'Edit Listing'}
            >
                {editingItem && editingItem.type === 'MARKET' && (
                    <MarketForm initialData={editingItem} onSuccess={handleSuccess} />
                )}
                {editingItem && editingItem.type === 'CONSIGNMENT' && (
                    <ConsignmentForm initialData={editingItem} onSuccess={handleSuccess} />
                )}
                {editingItem && editingItem.type === 'USER' && (
                    <VendorProfileForm initialData={editingItem} onSuccess={handleSuccess} />
                )}
            </AdminDrawer>
        </div>
    );
};

export default AdminDashboard;
