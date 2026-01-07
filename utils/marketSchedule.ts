type MarketSchedule = {
    season_start_date?: string | null;
    season_end_date?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    is_recurring?: boolean | null;
    recurring_pattern?: string | null;
};

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const normalizePattern = (value?: string | null) => {
    if (!value) return '';
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === 'null') return '';
    return normalized;
};

const parseDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameDay = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
};

const getWeekOfMonth = (date: Date) => {
    return Math.floor((date.getDate() - 1) / 7) + 1;
};

const isLastWeekdayOfMonth = (date: Date) => {
    const next = new Date(date);
    next.setDate(date.getDate() + 7);
    return next.getMonth() !== date.getMonth();
};

const getDaysFromPattern = (pattern: string) => {
    const days: number[] = [];
    dayNames.forEach((name, idx) => {
        if (pattern.includes(name)) {
            days.push(idx);
        }
    });
    return days;
};

const matchesMonthlyPattern = (date: Date, pattern: string) => {
    const days = getDaysFromPattern(pattern);
    if (days.length > 0 && !days.includes(date.getDay())) return false;

    if (pattern.includes('last')) {
        return isLastWeekdayOfMonth(date);
    }

    const ordinalMatch = pattern.match(/\b(\d)(st|nd|rd|th)\b/);
    if (ordinalMatch) {
        const ordinal = parseInt(ordinalMatch[1], 10);
        return getWeekOfMonth(date) === ordinal;
    }

    return days.length > 0 ? days.includes(date.getDay()) : false;
};

const matchesRecurringPattern = (date: Date, pattern: string) => {
    if (pattern.includes('daily') || pattern.includes('every day')) return true;
    if (pattern.includes('monthly')) return matchesMonthlyPattern(date, pattern);

    const days = getDaysFromPattern(pattern);
    if (days.length > 0) return days.includes(date.getDay());

    return true;
};

export const isMarketOnDate = (item: MarketSchedule, date: Date) => {
    const seasonStart = parseDate(item.season_start_date ?? item.start_date);
    const seasonEnd = parseDate(item.season_end_date ?? item.end_date);

    if (seasonStart && date < seasonStart) return false;
    if (seasonEnd && date > seasonEnd) return false;

    const recurringPattern = normalizePattern(item.recurring_pattern);
    if (!recurringPattern) {
        if (item.is_recurring === false) {
            if (seasonStart && seasonEnd) return date >= seasonStart && date <= seasonEnd;
            if (seasonStart) return isSameDay(date, seasonStart);
        }
        return true;
    }

    return matchesRecurringPattern(date, recurringPattern);
};
