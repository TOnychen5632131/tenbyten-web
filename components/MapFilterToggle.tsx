'use client';
import React from 'react';

interface MapFilterToggleProps {
    type: 'MARKET' | 'CONSIGNMENT';
    onChange: (type: 'MARKET' | 'CONSIGNMENT') => void;
}

const MapFilterToggle = ({ type, onChange }: MapFilterToggleProps) => {
    return (
        <div className="flex justify-center items-center gap-4 py-2">
            <button
                onClick={() => onChange('MARKET')}
                className={`flex flex-col items-center justify-center px-6 py-3 rounded-2xl border transition-all duration-300 w-[140px] relative overflow-hidden group ${type === 'MARKET'
                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)]'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
            >
                <span className="text-sm font-bold uppercase tracking-wide">Market</span>
                <span className="text-[10px] opacity-70 mt-1">Limited Events</span>
            </button>

            <button
                onClick={() => onChange('CONSIGNMENT')}
                className={`flex flex-col items-center justify-center px-6 py-3 rounded-2xl border transition-all duration-300 w-[140px] relative overflow-hidden group ${type === 'CONSIGNMENT'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(5,150,105,0.6)]'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
            >
                <span className="text-sm font-bold uppercase tracking-wide">Shop</span>
                <span className="text-[10px] opacity-70 mt-1">Consignment</span>
            </button>
        </div>
    );
};

export default MapFilterToggle;
