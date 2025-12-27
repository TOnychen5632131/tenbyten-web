
import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Calendar, MapPin, Tag } from 'lucide-react';

interface OpportunityListProps {
    onEdit: (item: any) => void;
}

const OpportunityList: React.FC<OpportunityListProps> = ({ onEdit }) => {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchOpportunities = async () => {
        try {
            const res = await fetch('/api/opportunities');
            const data = await res.json();
            setOpportunities(data);
        } catch (error) {
            console.error('Failed to fetch opportunities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this opportunity? This cannot be undone.')) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/opportunities?id=${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setOpportunities(prev => prev.filter(item => item.id !== id));
            } else {
                alert('Failed to delete');
            }
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-white/50 animate-pulse">Loading opportunities...</div>;
    }

    if (opportunities.length === 0) {
        return (
            <div className="p-12 text-center text-white/40 bg-white/5 rounded-2xl border border-dotted border-white/10">
                <p>No opportunities found. Create one to get started.</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                Manage Listings
                <span className="text-xs font-normal text-white/40 bg-white/10 px-2 py-1 rounded-full">{opportunities.length}</span>
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {opportunities.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/10 transition-colors group"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.type === 'MARKET'
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    }`}>
                                    {item.type}
                                </span>
                                <span className="text-xs text-white/40 flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{item.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-white/60">
                                {item.address && (
                                    <span className="flex items-center gap-1">
                                        <MapPin size={14} className="text-white/40" />
                                        <span className="truncate max-w-[200px]">{item.address}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <button
                                onClick={() => onEdit(item)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/20 transition-all text-sm font-medium border border-white/10"
                            >
                                <Pencil size={16} />
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-sm font-medium border border-red-500/20 disabled:opacity-50"
                            >
                                {deletingId === item.id ? '...' : <Trash2 size={16} />}
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OpportunityList;
