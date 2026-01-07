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
        <div className="relative">
            {/* Main Date Display Button */}
            <button
                onClick={() => setShowCalendar(true)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all outline-none hover:bg-foreground/5 dark:hover:bg-white/5"
            >
                <span className="text-sm md:text-base font-medium text-foreground font-sans flex items-baseline gap-1 dark:text-white">
                    {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <span className="text-foreground/40 font-normal text-xs dark:text-white/40">{selectedDate.getFullYear()}</span>
                </span>
                <ChevronDown className={`text-foreground/40 transition-transform duration-300 dark:text-white/40 ${showCalendar ? 'rotate-180' : ''}`} size={14} />
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
