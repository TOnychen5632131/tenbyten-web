import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/utils/openai';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You extract structured vintage market details from messy text or screenshots.
Return ONLY a JSON object with exactly these keys:
- title (string or null)
- description (string or null)
- address (string or null)
- latitude (number or null)
- longitude (number or null)
- season_start_date (YYYY-MM-DD or null)
- season_end_date (YYYY-MM-DD or null)
- start_time (HH:MM 24h or null)
- end_time (HH:MM 24h or null)
- application_start_date (YYYY-MM-DD or null)
- application_end_date (YYYY-MM-DD or null)
- additional_schedules (array of { label, start_date, end_date, start_time, end_time, days } or [])
- is_indoors (boolean or null)
- electricity_access (boolean or null)
- booth_size (string or null)
- is_schedule_tba (boolean or null)
- application_deadline (YYYY-MM-DD or null)
- vendor_count (number or null)
- admission_fee (number or null)
- admission_fees (array of { label, price } or [])
- website (string URL or null)
- is_trending (boolean or null)
- tags (string array or [])
- categories (string array or [])
- is_recurring (boolean or null)
- recurring_pattern (string or null, format: "Weekly on Sunday" or "Monthly on the 1st Saturday")
- organizer_name (string or null)
Rules:
- Do not guess missing details; use null or [] if not explicitly stated.
- Normalize dates to YYYY-MM-DD and times to HH:MM (24-hour).
- If a single event date is explicitly given, set both season_start_date and season_end_date to that date.
- If a date range is explicitly given, set season_start_date and season_end_date to the range.
- If the schedule is explicitly "TBA", "TBD", or "not announced", set is_schedule_tba true and leave date/time fields null.
- If recurring is explicitly stated, set is_recurring true and recurring_pattern accordingly.
- For admission fees like "$5", return 5 (number).
- For days, use full names (Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday).`;

type ScheduleSegment = {
    label: string;
    start_date: string | null;
    end_date: string | null;
    start_time: string | null;
    end_time: string | null;
    days: string[];
};

type AdmissionFee = {
    label: string;
    price: number | null;
};

type ParsedMarket = {
    title: string | null;
    description: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    season_start_date: string | null;
    season_end_date: string | null;
    start_time: string | null;
    end_time: string | null;
    application_start_date: string | null;
    application_end_date: string | null;
    additional_schedules: ScheduleSegment[];
    is_indoors: boolean | null;
    electricity_access: boolean | null;
    booth_size: string | null;
    is_schedule_tba: boolean | null;
    application_deadline: string | null;
    vendor_count: number | null;
    admission_fee: number | null;
    admission_fees: AdmissionFee[];
    website: string | null;
    is_trending: boolean | null;
    tags: string[];
    categories: string[];
    is_recurring: boolean | null;
    recurring_pattern: string | null;
    organizer_name: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const VALID_DAYS = new Set(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

const toText = (value: unknown) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};

const toDate = (value: unknown) => {
    const text = toText(value);
    if (!text) return null;
    return DATE_RE.test(text) ? text : null;
};

const toTime = (value: unknown) => {
    const text = toText(value);
    if (!text) return null;
    return TIME_RE.test(text) ? text : null;
};

const toNumber = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9.]/g, '').trim();
        if (!cleaned) return null;
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

const toBoolean = (value: unknown) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', 'yes', 'y'].includes(normalized)) return true;
        if (['false', 'no', 'n'].includes(normalized)) return false;
    }
    return null;
};

const toStringArray = (value: unknown) => {
    if (!Array.isArray(value)) return [];
    return value
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
};

const normalizeAdmissionFees = (value: unknown): AdmissionFee[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map(item => {
            if (!item || typeof item !== 'object') return null;
            const raw = item as Record<string, unknown>;
            const label = toText(raw.label);
            const price = toNumber(raw.price);
            if (!label && price === null) return null;
            return { label: label || 'General', price };
        })
        .filter((entry): entry is AdmissionFee => Boolean(entry));
};

const normalizeSchedules = (value: unknown): ScheduleSegment[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map(item => {
            if (!item || typeof item !== 'object') return null;
            const raw = item as Record<string, unknown>;
            const label = toText(raw.label) || 'Schedule';
            const days = toStringArray(raw.days).filter(day => VALID_DAYS.has(day));
            return {
                label,
                start_date: toDate(raw.start_date),
                end_date: toDate(raw.end_date),
                start_time: toTime(raw.start_time),
                end_time: toTime(raw.end_time),
                days
            };
        })
        .filter((entry): entry is ScheduleSegment => Boolean(entry));
};

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let text = '';
        let sourceUrl = '';
        let screenshotDataUrl: string | null = null;

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const textValue = formData.get('text');
            const urlValue = formData.get('source_url');
            const screenshotValue = formData.get('screenshot');

            text = typeof textValue === 'string' ? textValue : '';
            sourceUrl = typeof urlValue === 'string' ? urlValue : '';

            if (screenshotValue && typeof screenshotValue !== 'string' && screenshotValue.size > 0) {
                if (screenshotValue.size > 6_000_000) {
                    return NextResponse.json({ success: false, error: 'Screenshot is too large.' }, { status: 413 });
                }
                const arrayBuffer = await screenshotValue.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const mime = screenshotValue.type || 'image/png';
                screenshotDataUrl = `data:${mime};base64,${base64}`;
            }
        } else {
            const body = await req.json();
            text = typeof body?.text === 'string' ? body.text : '';
            sourceUrl = typeof body?.source_url === 'string' ? body.source_url : '';
        }

        if (!text.trim() && !screenshotDataUrl) {
            return NextResponse.json({ success: false, error: 'Text or screenshot required.' }, { status: 400 });
        }

        const userContent: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
            {
                type: 'text' as const,
                text: `Source URL: ${sourceUrl || 'N/A'}\n\nRaw Text:\n${text || '(none)'}`
            }
        ];

        if (screenshotDataUrl) {
            userContent.push({
                type: 'image_url' as const,
                image_url: { url: screenshotDataUrl }
            });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userContent }
            ],
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content returned from model.');
        }

        const raw = JSON.parse(content) as Partial<ParsedMarket>;
        const parsed: ParsedMarket = {
            title: toText(raw.title),
            description: toText(raw.description),
            address: toText(raw.address),
            latitude: toNumber(raw.latitude),
            longitude: toNumber(raw.longitude),
            season_start_date: toDate(raw.season_start_date),
            season_end_date: toDate(raw.season_end_date),
            start_time: toTime(raw.start_time),
            end_time: toTime(raw.end_time),
            application_start_date: toDate(raw.application_start_date),
            application_end_date: toDate(raw.application_end_date),
            additional_schedules: normalizeSchedules(raw.additional_schedules),
            is_indoors: toBoolean(raw.is_indoors),
            electricity_access: toBoolean(raw.electricity_access),
            booth_size: toText(raw.booth_size),
            is_schedule_tba: toBoolean(raw.is_schedule_tba),
            application_deadline: toDate(raw.application_deadline),
            vendor_count: toNumber(raw.vendor_count),
            admission_fee: toNumber(raw.admission_fee),
            admission_fees: normalizeAdmissionFees(raw.admission_fees),
            website: toText(raw.website),
            is_trending: toBoolean(raw.is_trending),
            tags: toStringArray(raw.tags),
            categories: toStringArray(raw.categories),
            is_recurring: toBoolean(raw.is_recurring),
            recurring_pattern: toText(raw.recurring_pattern),
            organizer_name: toText(raw.organizer_name)
        };

        if (parsed.is_schedule_tba) {
            parsed.season_start_date = null;
            parsed.season_end_date = null;
            parsed.start_time = null;
            parsed.end_time = null;
            parsed.is_recurring = false;
            parsed.recurring_pattern = null;
            parsed.additional_schedules = [];
        }

        return NextResponse.json({ success: true, data: parsed });
    } catch (error: any) {
        console.error('Market import parsing failed:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to parse market data.' },
            { status: 500 }
        );
    }
}
