'use client';
import React from 'react';

interface MapFilterToggleProps {
    type: 'MARKET' | 'CONSIGNMENT';
    onChange: (type: 'MARKET' | 'CONSIGNMENT') => void;
}

const MapFilterToggle = ({ type, onChange }: MapFilterToggleProps) => {
    return (
        <div className="flex bg-white/70 p-1 rounded-full border border-border relative shadow-sm dark:bg-black/20 dark:border-white/5">
            {/* Market Button */}
            <button
                onClick={() => onChange('MARKET')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 text-[11px] font-bold tracking-wide uppercase ${type === 'MARKET'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-white/40 dark:hover:text-white/60 dark:hover:bg-white/5'
                    }`}
            >
                <span className={type === 'MARKET' ? '' : 'opacity-50'}>Market</span>
            </button>

            {/* Shop Button */}
            <button
                onClick={() => onChange('CONSIGNMENT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 text-[11px] font-bold tracking-wide uppercase ${type === 'CONSIGNMENT'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-white/40 dark:hover:text-white/60 dark:hover:bg-white/5'
                    }`}
            >
                <span className={type === 'CONSIGNMENT' ? '' : 'opacity-50'}>Shop</span>
            </button>
        </div>
    );
};

export default MapFilterToggle;
