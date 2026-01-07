'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface TransparentCalendarProps {
    selectedDate: Date;
    onSelect: (date: Date) => void;
    onClose: () => void;
}

const TransparentCalendar = ({ selectedDate, onSelect, onClose }: TransparentCalendarProps) => {
    // Basic calendar logic
    const [viewDate, setViewDate] = useState(new Date(selectedDate));

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    // Adjust mapped day to start with Monday if needed, but standard US is Sunday (0)
    // Image shows M T W T F S S, so Monday start
    const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const renderCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        let firstDay = getFirstDayOfMonth(year, month);

        // Adjust for Monday start (0=Sun -> 6, 1=Mon -> 0)
        firstDay = firstDay === 0 ? 6 : firstDay - 1;

        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const isSelected = currentDate.toDateString() === selectedDate.toDateString();

            days.push(
                <button
                    key={day}
                    onClick={() => onSelect(currentDate)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${isSelected
                        ? 'bg-foreground text-background shadow-lg scale-105 font-bold dark:bg-white dark:text-black'
                        : 'text-foreground/70 hover:bg-foreground/10 dark:text-white/80 dark:hover:bg-white/10'
                        }`}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    // Portal Mounting safegaurd
    const [mounted, setMounted] = useState(false);
    React.useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const content = (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-end md:justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Click outside to close area */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Calendar Container */}
            <div className="relative w-full max-w-[360px] mb-8 md:mb-0 bg-white/90 backdrop-blur-3xl border border-border rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.15)] animate-slide-up transform transition-all z-10 mx-4 text-foreground dark:bg-zinc-900/90 dark:border-white/10 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] dark:text-white">

                {/* Header Section */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <span className="text-xl font-medium text-foreground tracking-tight dark:text-white">
                        {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex gap-1 bg-slate-100 rounded-full p-1 border border-border dark:bg-white/5 dark:border-white/5">
                        <button onClick={() => changeMonth(-1)} className="p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-200 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => changeMonth(1)} className="p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-200 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-1 px-4 mb-2">
                    {daysOfWeek.map(day => (
                        <div key={day} className="text-center text-slate-500 text-[11px] font-bold tracking-wider py-2 dark:text-white/30">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-1 gap-x-1 px-4 pb-6 justify-items-center">
                    {renderCalendarDays()}
                </div>

                {/* Action Footer */}
                <div className="border-t border-border p-4 flex justify-center bg-slate-50 dark:border-white/5 dark:bg-white/5">
                    <button
                        onClick={() => onClose()}
                        className="w-full py-3 bg-foreground text-background rounded-full font-semibold text-sm hover:bg-foreground/90 transition-colors active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-gray-100"
                    >
                        Confirm Date
                    </button>
                </div>
            </div>
        </div>
    );

    // Dynamic import for createPortal to avoid SSR issues
    const { createPortal } = require('react-dom');
    return createPortal(content, document.body);
};

export default TransparentCalendar;
