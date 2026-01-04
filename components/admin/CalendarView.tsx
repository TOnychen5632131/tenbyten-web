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
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday
        const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

        return opportunities.filter(opp => {
            if (opp.type !== 'MARKET') return false;

            // Check season bounds if available
            if (opp.season_start_date && new Date(opp.season_start_date) > targetDate) return false;
            if (opp.season_end_date && new Date(opp.season_end_date) < targetDate) return false;

            // Check recurrence pattern
            // This is a basic implementation. Ideally, use a robust recurrence library.
            const pattern = (opp.recurring_pattern || '').toLowerCase();

            if (pattern.includes('sunday') && dayOfWeek === 0) return true;
            if (pattern.includes('monday') && dayOfWeek === 1) return true;
            if (pattern.includes('tuesday') && dayOfWeek === 2) return true;
            if (pattern.includes('wednesday') && dayOfWeek === 3) return true;
            if (pattern.includes('thursday') && dayOfWeek === 4) return true;
            if (pattern.includes('friday') && dayOfWeek === 5) return true;
            if (pattern.includes('saturday') && dayOfWeek === 6) return true;

            // Handle "Every day" or similar simple cases if needed
            if (pattern.includes('daily') || pattern.includes('every day')) return true;

            return false;
        }).length;
    };

    const renderDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-white/5 border border-white/5 opacity-50"></div>);
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const count = getMarketCountsForDate(i);
            days.push(
                <div
                    key={i}
                    className={`h-24 border border-white/10 p-2 relative hover:bg-white/10 transition-colors cursor-pointer group`}
                    onClick={() => onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))}
                >
                    <span className="text-white/60 text-sm font-mono">{i}</span>
                    {count > 0 && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                                {count}
                            </div>
                            <div className="text-[10px] text-center text-blue-300 mt-1 font-medium">Markets</div>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#111] rounded-3xl w-full max-w-4xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-4">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ChevronLeft />
                        </button>
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ChevronRight />
                        </button>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full text-white/40 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Weekdays Header */}
                <div className="grid grid-cols-7 bg-black/20 text-center py-2 border-b border-white/10">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-white/40 text-xs font-bold uppercase tracking-wider">{day}</div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 overflow-y-auto bg-black/40">
                    {renderDays()}
                </div>

                {/* Footer / Legend */}
                <div className="p-4 bg-white/5 border-t border-white/10 text-xs text-white/40 flex justify-between">
                    <span>Click a date to filter opportunities.</span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Active Market
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
