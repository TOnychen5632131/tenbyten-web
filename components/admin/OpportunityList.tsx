import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight, CheckSquare, Square, RefreshCw, Link2, Calendar } from 'lucide-react';
import CalendarView from './CalendarView';

interface OpportunityListProps {
    onEdit: (item: any) => void;
}

const OpportunityList: React.FC<OpportunityListProps> = ({ onEdit }) => {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [editingPlaceIdItem, setEditingPlaceIdItem] = useState<any | null>(null);
    const [placeIdInput, setPlaceIdInput] = useState('');
    const [savingPlaceId, setSavingPlaceId] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [filterType, setFilterType] = useState<string>('ALL'); // ALL, MARKET, CONSIGNMENT
    const [year, setYear] = useState<number>(2026); // Default 2026
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<string>('desc');

    // Debounce/Auto-fetch currently only on filters/pagination, NOT search query
    useEffect(() => {
        fetchOpportunities();
    }, [currentPage, filterType, itemsPerPage, year, sortBy, sortOrder]); // Removed searchQuery from dependencies

    const fetchOpportunities = async (overridePage?: number) => {
        setLoading(true);
        try {
            // If searching, we might want to reset to page 1, pass overridePage if needed
            const pageToFetch = overridePage !== undefined ? overridePage : currentPage;

            const params = new URLSearchParams({
                page: pageToFetch.toString(),
                limit: itemsPerPage.toString(),
                q: searchQuery,
                type: filterType,
                year: year.toString(),
                sort_by: sortBy,
                order: sortOrder
            });

            const res = await fetch(`/api/opportunities?${params.toString()}`);
            const responseData = await res.json();

            // Handle new API response structure { data, meta }
            if (responseData.data) {
                setOpportunities(responseData.data);
                setTotalItems(responseData.meta.total);
                setTotalPages(responseData.meta.totalPages);

                // If we forced a page reset, update state
                if (overridePage !== undefined) {
                    setCurrentPage(overridePage);
                }
            } else {
                setOpportunities([]);
                setTotalItems(0);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Failed to fetch opportunities:', error);
        } finally {
            setLoading(false);
        }
    };

    // Selection Logic (Current Page Only)
    const toggleSelectAll = () => {
        if (selectedIds.size === opportunities.length && opportunities.length > 0) {
            setSelectedIds(new Set());
        } else {
            const newSet = new Set(selectedIds);
            opportunities.forEach(item => newSet.add(item.id));
            setSelectedIds(newSet);
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) return;

        try {
            const deletePromises = Array.from(selectedIds).map(id =>
                fetch(`/api/opportunities?id=${id}`, { method: 'DELETE' })
            );
            await Promise.all(deletePromises);

            // Refresh logic: clear selection and re-fetch
            setSelectedIds(new Set());
            fetchOpportunities();
        } catch (error) {
            console.error("Bulk delete failed", error);
            alert("Some items failed to delete");
        }
    };

    // Trigger search manually
    const handleSearchClick = () => {
        fetchOpportunities(1); // Reset to page 1 on new search
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };

    const handleFilterChange = (val: string) => {
        setFilterType(val);
        setCurrentPage(1);
    };

    const handleYearChange = (val: string) => {
        setYear(parseInt(val));
        setCurrentPage(1);
    };

    const openPlaceIdEditor = (item: any) => {
        setEditingPlaceIdItem(item);
        setPlaceIdInput(item?.google_place_id || '');
    };

    const closePlaceIdEditor = () => {
        setEditingPlaceIdItem(null);
        setPlaceIdInput('');
    };

    const handlePlaceIdSave = async () => {
        if (!editingPlaceIdItem?.id) return;
        setSavingPlaceId(true);
        try {
            const payload = {
                id: editingPlaceIdItem.id,
                google_place_id: placeIdInput.trim() || null
            };
            const res = await fetch('/api/opportunities', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'Failed to update Google Place ID');
            }
            setOpportunities(prev =>
                prev.map(item =>
                    item.id === editingPlaceIdItem.id
                        ? { ...item, google_place_id: payload.google_place_id }
                        : item
                )
            );
            closePlaceIdEditor();
        } catch (error) {
            console.error('Failed to update Google Place ID:', error);
            alert('Failed to update Google Place ID. Check console for details.');
        } finally {
            setSavingPlaceId(false);
        }
    };

    const handleRefreshReviews = async (item: any) => {
        if (!item?.id) return;
        const confirmed = confirm(`Refresh Google reviews for "${item.title || 'this listing'}"?`);
        if (!confirmed) return;

        setRefreshingId(item.id);
        try {
            const res = await fetch(`/api/reviews?opportunity_id=${item.id}&force=1&debug=1`);
            const data = await res.json();
            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'Failed to refresh reviews');
            }
            const count = Array.isArray(data?.reviews) ? data.reviews.length : 0;
            const source = data?.source ? ` Source: ${data.source}.` : '';
            alert(`Reviews updated (${count} found).${source}`);
            if (data?.debug) {
                console.info('Review refresh debug:', data.debug);
            }
        } catch (error) {
            console.error('Failed to refresh reviews:', error);
            alert('Failed to refresh reviews. Check console for details.');
        } finally {
            setRefreshingId(null);
        }
    };

    if (loading && opportunities.length === 0) {
        return <div className="p-8 text-center text-white/50 animate-pulse">Loading data...</div>;
    }

    return (
        <div className="w-full space-y-4">
            {/* Toolbar */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-4">
                {/* Search & Main Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                        <div className="relative flex-1 md:max-w-md">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search server..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        <button
                            onClick={handleSearchClick}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                        >
                            Search
                        </button>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                        {/* Mobile Filter Toggle (Could be implemented if needed, but horizontal scroll works for now) */}

                        <label className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60 whitespace-nowrap">
                            <span className="uppercase font-bold text-[10px]">Type</span>
                            <select
                                value={filterType}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="bg-transparent text-white font-medium focus:outline-none"
                            >
                                <option value="ALL">All</option>
                                <option value="MARKET">Markets</option>
                                <option value="CONSIGNMENT">Shops</option>
                            </select>
                        </label>

                        <label className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60 whitespace-nowrap">
                            <span className="uppercase font-bold text-[10px]">Year</span>
                            <select
                                value={year}
                                onChange={(e) => handleYearChange(e.target.value)}
                                className="bg-transparent text-white font-medium focus:outline-none"
                            >
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                            </select>
                        </label>

                        <label className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60 whitespace-nowrap">
                            <span className="uppercase font-bold text-[10px]">Sort</span>
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [newSort, newOrder] = e.target.value.split('-');
                                    setSortBy(newSort);
                                    setSortOrder(newOrder);
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent text-white font-medium focus:outline-none"
                            >
                                <option value="created_at-desc">Newest Added</option>
                                <option value="season_start_date-asc">Event Date (Soonest)</option>
                                <option value="season_start_date-desc">Event Date (Latest)</option>
                                <option value="application_deadline-asc">Deadline (Soonest)</option>
                                <option value="application_deadline-desc">Deadline (Latest)</option>
                            </select>
                        </label>
                    </div>
                </div>

                {/* Bulk Actions & Calendar Toggle */}
                <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 ? (
                            <div className="flex items-center gap-2 animate-fade-in">
                                <span className="text-sm text-white/60">{selectedIds.size} selected</span>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Delete Selected
                                </button>
                            </div>
                        ) : (
                            <div className="text-xs text-white/20">Select items to bulk actions</div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowCalendar(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
                    >
                        <Calendar size={16} />
                        <span className="hidden md:inline">View Calendar</span>
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 w-12">
                                    <button onClick={toggleSelectAll} className="text-white/40 hover:text-white transition-colors">
                                        {selectedIds.size === opportunities.length && opportunities.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
                                </th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest">Title</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest">Type</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest">Status / Date</th>
                                <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 relative">
                            {/* Loading overlay for refetching */}
                            {loading && (
                                <tr className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <td></td>
                                </tr>
                            )}

                            {opportunities.map((item) => (
                                <tr
                                    key={item.id}
                                    className={`group transition-colors cursor-pointer ${selectedIds.has(item.id) ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'hover:bg-white/5'}`}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('button')) return;
                                        onEdit(item);
                                    }}
                                >
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleSelect(item.id)}
                                            className={`transition-colors ${selectedIds.has(item.id) ? 'text-blue-400' : 'text-white/20 group-hover:text-white/40'}`}
                                        >
                                            {selectedIds.has(item.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-white text-sm">{item.title}</div>
                                        <div className="text-xs text-white/40 truncate max-w-[200px]">{item.address || "No address"}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.type === 'MARKET'
                                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-white/70">
                                                {(item.season_start_date)
                                                    ? new Date(item.season_start_date + 'T00:00:00').toLocaleDateString()
                                                    : <span className="text-emerald-400">Published</span>
                                                }
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openPlaceIdEditor(item); }}
                                                className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${item.google_place_id ? 'text-emerald-300' : 'text-white/40 hover:text-white'}`}
                                                title="Edit Google Place ID"
                                            >
                                                <Link2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRefreshReviews(item); }}
                                                disabled={refreshingId === item.id}
                                                className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                title="Refresh Google reviews"
                                            >
                                                <RefreshCw size={16} className={refreshingId === item.id ? 'animate-spin' : ''} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                                title="Edit listing"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && opportunities.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-white/30 text-sm">No items found matching query.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
                    <div className="text-xs text-white/40">
                        {totalItems === 0 ? 'No items' : `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-mono text-white/60">Page {currentPage} of {totalPages || 1}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages || loading}
                            className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Modal */}
            {showCalendar && (
                <CalendarView
                    opportunities={opportunities}
                    onDateSelect={(date) => {
                        console.log('Selected date:', date);
                        // Optional: Filter list by this date if desired
                        // For now, just logging or maybe setting a filter state could be added later
                        alert(`Selected date: ${date.toLocaleDateString()}`);
                    }}
                    onClose={() => setShowCalendar(false)}
                />
            )}

            {editingPlaceIdItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="absolute inset-0" onClick={closePlaceIdEditor} />
                    <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-5 shadow-2xl">
                        <div className="text-white font-bold text-lg">Edit Google Place ID</div>
                        <div className="text-white/50 text-xs mt-1 truncate">
                            {editingPlaceIdItem.title || 'Listing'}
                        </div>
                        <input
                            value={placeIdInput}
                            onChange={(e) => setPlaceIdInput(e.target.value)}
                            placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                            className="mt-4 w-full rounded-xl bg-black/20 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        />
                        <div className="text-white/40 text-[11px] mt-2">
                            Paste the Google Place ID. Leave blank to clear.
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={closePlaceIdEditor}
                                className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePlaceIdSave}
                                disabled={savingPlaceId}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingPlaceId ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OpportunityList;
