import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarViewProps {
    opportunities: any[];
    onDateSelect: (date: Date) => void;
    onClose: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ opportunities, onDateSelect, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getMarketCountsForDate = (day: number) => {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        targetDate.setHours(0, 0, 0, 0);
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday

        return opportunities.filter(opp => {
            // Check if it's a fixed date event
            if (!opp.recurring_pattern || opp.recurring_pattern === 'null') {
                const startStr = opp.season_start_date || opp.start_date;
                if (!startStr) return false;
                const startDate = new Date(startStr);
                startDate.setHours(0, 0, 0, 0);
                return startDate.getTime() === targetDate.getTime();
            }

            // Recurring event logic
            if (opp.type !== 'MARKET') return false;

            // Check season bounds
            if (opp.season_start_date) {
                const start = new Date(opp.season_start_date);
                start.setHours(0, 0, 0, 0);
                if (start > targetDate) return false;
            }
            if (opp.season_end_date) {
                const end = new Date(opp.season_end_date);
                end.setHours(0, 0, 0, 0);
                if (end < targetDate) return false;
            }

            const pattern = (opp.recurring_pattern || '').toLowerCase();

            // Basic day name checks
            const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            if (pattern.includes(daysMap[dayOfWeek])) return true;

            // Daily check
            if (pattern.includes('daily') || pattern.includes('every day')) return true;

            return false;
        }).length;
    };

    const renderDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);
        const monthName = currentDate.toLocaleString('default', { month: 'short' });

        // Empty cells for previous month padding
        for (let i = 0; i < startDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="min-h-[60px] md:min-h-[100px] bg-white/5 border-b border-r border-white/5 opacity-30 flex flex-col justify-between p-2">
                    {/* Placeholder */}
                </div>
            );
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const count = getMarketCountsForDate(i);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();

            days.push(
                <div
                    key={i}
                    onClick={() => onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))}
                    className={`
                        group relative min-h-[60px] md:min-h-[100px] border-b border-r border-white/10 
                        p-1 md:p-2 flex flex-col items-center md:items-start justify-between 
                        transition-all duration-200 cursor-pointer
                        hover:bg-white/10 active:bg-white/20
                        ${isToday ? 'bg-blue-500/5' : ''}
                    `}
                >
                    {/* Date Number */}
                    <span className={`
                        text-xs md:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full transition-all
                        ${isToday ? 'border border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-white/60 group-hover:text-white'}
                    `}>
                        {i}
                    </span>

                    {/* Count Indicator */}
                    {count > 0 && (
                        <div className="flex-1 flex items-center justify-center w-full mt-1">
                            <div className="flex flex-col items-center">
                                {/* Number Badge */}
                                <div className="
                                    w-6 h-6 md:w-8 md:h-8 rounded-full 
                                    bg-gradient-to-br from-blue-500 to-blue-600 
                                    text-white text-[10px] md:text-xs font-bold 
                                    flex items-center justify-center 
                                    shadow-[0_2px_8px_rgba(59,130,246,0.4)]
                                    border border-white/10
                                    group-hover:scale-110 transition-transform duration-200
                                ">
                                    {count}
                                </div>
                                {/* Label only on Desktop */}
                                <span className="hidden md:block text-[8px] text-blue-300/80 mt-1 uppercase tracking-wider font-semibold">
                                    Markets
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div
                className="w-full max-w-lg md:max-w-4xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-1 bg-black/20 rounded-lg p-1 border border-white/5">
                            <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Weekdays Header */}
                <div className="grid grid-cols-7 bg-[#161616] border-b border-white/10">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="py-3 text-center text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest">
                            <span className="md:hidden">{day}</span>
                            <span className="hidden md:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 bg-[#0a0a0a] overflow-y-auto">
                    {renderDays()}
                </div>

                {/* Footer Legend */}
                <div className="p-3 md:p-4 bg-white/5 border-t border-white/10 text-[10px] md:text-xs text-white/40 flex justify-between items-center pb-8 md:pb-4">
                    <span>Tap a date to see details</span>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                        <span className="font-medium text-white/60">Active Market</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
