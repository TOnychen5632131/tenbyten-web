'use client';
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import TransparentCalendar from './TransparentCalendar';

interface MapDateSelectorProps {
    onDateSelect: (date: Date) => void;
}

const MapDateSelector = ({ onDateSelect }: MapDateSelectorProps) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        onDateSelect(date);
        // Don't close immediately, let user click Done multiple times? Or close? User image has "Done".
        // Usually clicking a day selects it visually. The "Done" button closes.
    };

    return (
        <div className="flex flex-col items-center justify-center py-4">
            {/* Main Date Display Button */}
            <button
                onClick={() => setShowCalendar(true)}
                className="group relative flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-300 active:scale-95 hover:bg-white/5"
            >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-300 group-hover:bg-white/15 group-hover:border-white/20" />

                <span className="relative z-10 text-base md:text-xl font-light tracking-tight text-white font-sans">
                    {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <span className="opacity-50 ml-1.5 font-normal text-xs md:text-sm">{selectedDate.getFullYear()}</span>
                </span>

                <ChevronDown className={`relative z-10 text-white/40 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${showCalendar ? 'rotate-180' : ''}`} size={20} strokeWidth={1.5} />
            </button>

            {/* Calendar Overlay */}
            {showCalendar && (
                <TransparentCalendar
                    selectedDate={selectedDate}
                    onSelect={handleDateSelect}
                    onClose={() => setShowCalendar(false)}
                />
            )}
        </div>
    );
};

export default MapDateSelector;
