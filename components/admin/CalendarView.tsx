import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { isMarketOnDate } from '@/utils/marketSchedule';

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
        return opportunities.filter((opp) => opp.type === 'MARKET' && !opp.is_schedule_tba && isMarketOnDate(opp, targetDate)).length;
    };

    const renderDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);
        const monthName = currentDate.toLocaleString('default', { month: 'short' });

        // Empty cells for previous month padding
        for (let i = 0; i < startDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="min-h-[40px] md:min-h-[60px] bg-slate-50 border-b border-r border-border/60 opacity-60 flex flex-col justify-between p-1 dark:bg-white/5 dark:border-white/5 dark:opacity-30">
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
                        group relative min-h-[40px] md:min-h-[60px] border-b border-r border-border 
                        p-1 flex flex-col items-center md:items-start justify-between 
                        transition-all duration-200 cursor-pointer
                        hover:bg-slate-100 active:bg-slate-200 dark:border-white/10 dark:hover:bg-white/10 dark:active:bg-white/20
                        ${isToday ? 'bg-blue-500/5' : ''}
                    `}
                >
                    {/* Date Number */}
                    <span className={`
                        text-xs md:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full transition-all
                        ${isToday ? 'border border-blue-500 text-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.2)] dark:text-blue-400' : 'text-slate-600 group-hover:text-slate-900 dark:text-white/60 dark:group-hover:text-white'}
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
                                    border border-blue-200 dark:border-white/10
                                    group-hover:scale-110 transition-transform duration-200
                                ">
                                    {count}
                                </div>
                                {/* Label only on Desktop */}
                                <span className="hidden md:block text-[8px] text-blue-700/80 mt-1 uppercase tracking-wider font-semibold dark:text-blue-300/80">
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 dark:bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-white border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-foreground dark:bg-[#111] dark:border-white/10 dark:text-white"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-slate-50 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base md:text-lg font-bold text-foreground tracking-tight">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 border border-border dark:bg-black/20 dark:border-white/5">
                            <button onClick={prevMonth} className="p-1 hover:bg-slate-200 rounded-md text-slate-600 hover:text-slate-900 transition-colors dark:hover:bg-white/10 dark:text-white/70 dark:hover:text-white">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={nextMonth} className="p-1 hover:bg-slate-200 rounded-md text-slate-600 hover:text-slate-900 transition-colors dark:hover:bg-white/10 dark:text-white/70 dark:hover:text-white">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors dark:hover:bg-white/10 dark:text-white/40 dark:hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Weekdays Header */}
                <div className="grid grid-cols-7 bg-slate-100 border-b border-border dark:bg-[#161616] dark:border-white/10">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="py-3 text-center text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest dark:text-white/40">
                            <span className="md:hidden">{day}</span>
                            <span className="hidden md:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 bg-white overflow-y-auto dark:bg-[#0a0a0a]">
                    {renderDays()}
                </div>

                {/* Footer Legend */}
                <div className="p-3 md:p-4 bg-slate-50 border-t border-border text-[10px] md:text-xs text-slate-500 flex justify-between items-center pb-8 md:pb-4 dark:bg-white/5 dark:border-white/10 dark:text-white/40">
                    <span>Tap a date to see details</span>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                        <span className="font-medium text-slate-600 dark:text-white/60">Active Market</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
