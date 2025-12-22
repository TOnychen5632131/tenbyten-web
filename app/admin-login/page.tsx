'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

const AdminLogin = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded password as requested by user ("default password")
        // In a real app, this should be server-side validated and secure.
        if (password === 'admin123') {
            // Set a simple "auth" cookie or local storage
            localStorage.setItem('isAdmin', 'true');
            router.push('/admin/dashboard');
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black text-white p-4">
            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 rounded-full bg-blue-500/20 text-blue-400 mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Admin Access</h1>
                    <p className="text-white/50 text-sm mt-2">Enter your secure password to continue</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        {error && (
                            <p className="text-red-400 text-xs mt-2 ml-1">{error}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
                    >
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
