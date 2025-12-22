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
                        ? 'bg-white text-black shadow-lg scale-105 font-bold'
                        : 'text-white/80 hover:bg-white/10'
                        }`}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end md:justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            {/* Click outside to close area */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Calendar Container */}
            <div className="relative w-full max-w-[360px] mb-8 md:mb-0 bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-slide-up transform transition-all">

                {/* Header Section */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <span className="text-xl font-medium text-white tracking-tight">
                        {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                        <button onClick={() => changeMonth(-1)} className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => changeMonth(1)} className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-1 px-4 mb-2">
                    {daysOfWeek.map(day => (
                        <div key={day} className="text-center text-white/30 text-[11px] font-bold tracking-wider py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-1 gap-x-1 px-4 pb-6 justify-items-center">
                    {renderCalendarDays()}
                </div>

                {/* Action Footer */}
                <div className="border-t border-white/5 p-4 flex justify-center bg-white/5">
                    <button
                        onClick={() => onClose()}
                        className="w-full py-3 bg-white text-black rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors active:scale-[0.98]"
                    >
                        Confirm Date
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransparentCalendar;

