import React, { useState, useEffect } from 'react';
import { Search, Edit, LayoutGrid, List } from 'lucide-react';
import { supabase } from '@/utils/supabase';

interface UserListProps {
    onEdit: (user: any) => void;
}

const UserList: React.FC<UserListProps> = ({ onEdit }) => {
    // const supabase = createClientComponentClient(); // Removed
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('vendor_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.brand_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (user.product_description?.toLowerCase() || '').includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="text-white/50 text-center p-8">Loading users...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* List/Grid View */}
            {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-white/30">No users found.</div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="group bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all hover:bg-white/[0.07]">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.brand_name} className="w-12 h-12 rounded-full object-cover bg-white/10" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-white font-bold text-lg">
                                            {(user.brand_name?.[0] || '?').toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-white leading-tight">{user.brand_name || 'Unnamed Vendor'}</h3>
                                        <p className="text-xs text-white/40 font-mono mt-1 truncate w-24">{user.id.slice(0, 8)}...</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onEdit({ ...user, type: 'USER' })}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                                >
                                    <Edit size={16} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm text-white/60 line-clamp-2 min-h-[40px]">
                                    {user.product_description || 'No description provided.'}
                                </p>

                                {user.top_markets && user.top_markets.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {user.top_markets.slice(0, 3).map((market: string, i: number) => (
                                            <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/70 border border-white/5">
                                                {market}
                                            </span>
                                        ))}
                                        {user.top_markets.length > 3 && (
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/50">
                                                +{user.top_markets.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-white/5 text-xs uppercase font-medium text-white/40">
                            <tr>
                                <th className="p-4">Vendor</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Markets</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.brand_name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                                                    {(user.brand_name?.[0] || '?').toUpperCase()}
                                                </div>
                                            )}
                                            <span className="font-medium text-white">{user.brand_name || 'Unnamed'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 max-w-xs truncate">{user.product_description}</td>
                                    <td className="p-4">
                                        <div className="flex gap-1 flex-wrap max-w-xs">
                                            {user.top_markets?.slice(0, 2).map((m: string, i: number) => (
                                                <span key={i} className="bg-white/10 px-1.5 py-0.5 rounded textxs">{m}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => onEdit({ ...user, type: 'USER' })}
                                            className="text-white/50 hover:text-blue-400 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserList;
