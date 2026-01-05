import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface TimePickerProps {
    value: string; // HH:MM (24h)
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className = "", disabled }) => {
    // Parse 24h string to 12h parts
    const parseTime = (val: string) => {
        if (!val) return { hour: '12', minute: '00', period: 'AM' };
        const [h, m] = val.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12; // 0 becomes 12
        return {
            hour: hour.toString(),
            minute: m.toString().padStart(2, '0'),
            period
        };
    };

    const [internal, setInternal] = useState(parseTime(value));

    useEffect(() => {
        setInternal(parseTime(value));
    }, [value]);

    const updateTime = (newParts: Partial<typeof internal>) => {
        const next = { ...internal, ...newParts };
        setInternal(next);

        // Convert back to 24h for parent
        let h = parseInt(next.hour);
        if (next.period === 'PM' && h < 12) h += 12;
        if (next.period === 'AM' && h === 12) h = 0;

        const timeStr = `${h.toString().padStart(2, '0')}:${next.minute}`;
        onChange(timeStr);
    };

    return (
        <div className={`flex flex-wrap items-center gap-1 w-full ${className}`}>
            <div className="relative">
                <select
                    value={internal.hour}
                    onChange={(e) => updateTime({ hour: e.target.value })}
                    disabled={disabled}
                    className="w-full min-w-[65px] appearance-none bg-black/20 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <option key={h} value={h}>{h}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>

            <span className="text-white/40 font-bold">:</span>

            <div className="relative">
                <select
                    value={internal.minute}
                    onChange={(e) => updateTime({ minute: e.target.value })}
                    disabled={disabled}
                    className="w-full min-w-[55px] appearance-none bg-black/20 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {['00', '15', '30', '45'].map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>

            <div className="relative ml-1">
                <select
                    value={internal.period}
                    onChange={(e) => updateTime({ period: e.target.value })}
                    disabled={disabled}
                    className={`w-full min-w-[70px] appearance-none border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm font-bold focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${internal.period === 'AM' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                        }`}
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
        </div>
    );
};

export default TimePicker;
