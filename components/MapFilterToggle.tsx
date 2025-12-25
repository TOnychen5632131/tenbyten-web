'use client';
import React from 'react';

interface MapFilterToggleProps {
    type: 'MARKET' | 'CONSIGNMENT';
    onChange: (type: 'MARKET' | 'CONSIGNMENT') => void;
}

const MapFilterToggle = ({ type, onChange }: MapFilterToggleProps) => {
    return (
        <div className="flex justify-center items-center gap-3 py-1">
            <button
                onClick={() => onChange('MARKET')}
                className={`flex flex-col items-center justify-center px-2 py-1.5 md:px-3 md:py-2 rounded-2xl border transition-all duration-300 w-[85px] md:w-[110px] relative overflow-hidden group ${type === 'MARKET'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
            >
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide">Market</span>
                <span className="text-[8px] md:text-[9px] opacity-70 mt-0.5">Limited Events</span>
            </button>

            <button
                onClick={() => onChange('CONSIGNMENT')}
                className={`flex flex-col items-center justify-center px-2 py-1.5 md:px-3 md:py-2 rounded-2xl border transition-all duration-300 w-[85px] md:w-[110px] relative overflow-hidden group ${type === 'CONSIGNMENT'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(5,150,105,0.6)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
            >
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide">Shop</span>
                <span className="text-[8px] md:text-[9px] opacity-70 mt-0.5">Consignment</span>
            </button>
        </div>
    );
};

export default MapFilterToggle;
