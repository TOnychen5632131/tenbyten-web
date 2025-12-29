import { supabase } from '@/utils/supabase';
import { generateEmbedding, openai } from '@/utils/openai';
import { NextRequest, NextResponse } from 'next/server';

const VENDOR_TYPES = [
    'Farm',
    'Vintage',
    'Booth',
    'Processor',
    'Importer',
    'Food Truck',
    'Community',
    'Craft',
    'Hot Food',
    'Non-Profit'
];

const VENDOR_TYPE_ALIASES = new Map<string, string>([
    ['farm', 'Farm'],
    ['vintage', 'Vintage'],
    ['booth', 'Booth'],
    ['processor', 'Processor'],
    ['importer', 'Importer'],
    ['foodtruck', 'Food Truck'],
    ['community', 'Community'],
    ['craft', 'Craft'],
    ['cratt', 'Craft'],
    ['hotfood', 'Hot Food'],
    ['nonprofit', 'Non-Profit']
]);

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeTagForCompare = (value: string) => {
    const normalized = value
        .toLowerCase()
        .replace(/^#+/, '')
        .replace(/[^a-z0-9]+/g, '');
    if (normalized.endsWith('s') && normalized.length > 3) {
        return normalized.slice(0, -1);
    }
    return normalized;
};

const normalizeVendorType = (value: string) => {
    if (!value) return null;
    const normalized = normalizeTagForCompare(value);
    if (!normalized) return null;
    return VENDOR_TYPE_ALIASES.get(normalized)
        || VENDOR_TYPES.find((type) => normalizeTagForCompare(type) === normalized)
        || null;
};

const toArray = (value: unknown) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};

const mergeTags = (a?: unknown, b?: unknown) => {
    const merged = [...toArray(a), ...toArray(b)]
        .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
    return merged.length ? Array.from(new Set(merged)) : [];
};

const parseDate = (value?: string | null) => {
    if (!value || typeof value !== 'string') return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const toDateOnly = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const rangeOverlaps = (startA: Date, endA: Date, startB: Date, endB: Date) => {
    return startA <= endB && endA >= startB;
};

const rangeHasDayOfWeek = (start: Date, end: Date, dayIndex: number) => {
    const startDay = start.getUTCDay();
    const diffDays = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
    if (diffDays >= 6) return true;
    const offset = (dayIndex - startDay + 7) % 7;
    return offset <= diffDays;
};

const extractPatternDays = (pattern?: string | null) => {
    if (!pattern) return [];
    const lower = pattern.toLowerCase();
    if (lower.includes('daily')) return WEEKDAYS.map((_, index) => index);
    return WEEKDAYS.reduce((acc, day, index) => {
        if (lower.includes(day)) acc.push(index);
        return acc;
    }, [] as number[]);
};

const inferVendorTypesFromText = (text: string) => {
    const hits = new Set<string>();
    const addIf = (regex: RegExp, type: string) => {
        if (regex.test(text)) hits.add(type);
    };

    addIf(/vintage|thrift|resale|second\s*hand|pre[-\s]?loved|clothing|apparel|garment|古着|复古|二手|衣服|服装/i, 'Vintage');
    addIf(/farm|farmer|farmers\s*market|农场|农产品/i, 'Farm');
    addIf(/booth|stall|摊位|摆摊|摊主/i, 'Booth');
    addIf(/processor|processed\s*food|加工食品|加工/i, 'Processor');
    addIf(/importer|imported|进口|海淘/i, 'Importer');
    addIf(/food\s*truck|餐车|美食车/i, 'Food Truck');
    addIf(/community|社区|邻里/i, 'Community');
    addIf(/craft|handmade|artisan|手作|手工|文创/i, 'Craft');
    addIf(/hot\s*food|prepared\s*food|熟食|热食|现做|现烤/i, 'Hot Food');
    addIf(/non[-\s]?profit|nonprofit|ngo|公益|非营利|慈善/i, 'Non-Profit');

    return Array.from(hits);
};

const inferVendorTypeMentionFromText = (text: string) => {
    return /卖|销售|出售|卖家|摊主|摆摊|vendor|seller|selling|sell/i.test(text);
};

const inferDateRangeFromText = (text: string) => {
    const lower = text.toLowerCase();
    const today = toDateOnly(new Date());

    if (lower.includes('next week') || text.includes('下周')) {
        const day = today.getUTCDay();
        const daysUntilNextMonday = ((8 - day) % 7) || 7;
        const start = new Date(today.getTime() + daysUntilNextMonday * MS_PER_DAY);
        const end = new Date(start.getTime() + 6 * MS_PER_DAY);
        return { start, end };
    }

    if (lower.includes('weekend') || text.includes('周末')) {
        const day = today.getUTCDay();
        const daysUntilSaturday = (6 - day + 7) % 7;
        const start = new Date(today.getTime() + daysUntilSaturday * MS_PER_DAY);
        const end = new Date(start.getTime() + MS_PER_DAY);
        return { start, end };
    }

    if (lower.includes('this week') || text.includes('这周') || text.includes('本周') || text.includes('本星期') || text.includes('本礼拜')) {
        const day = today.getUTCDay();
        const daysSinceMonday = (day + 6) % 7;
        const start = new Date(today.getTime() - daysSinceMonday * MS_PER_DAY);
        const end = new Date(start.getTime() + 6 * MS_PER_DAY);
        return { start, end };
    }

    return null;
};

const inferIntentTypeFromText = (text: string) => {
    if (/consignment|resale|thrift|second\s*hand|寄卖|二手店|二手商店/i.test(text)) {
        return 'CONSIGNMENT';
    }
    if (/market|市集|集市|marketplace/i.test(text)) {
        return 'MARKET';
    }
    return 'ANY';
};

const inferDayOfWeekFromText = (text: string) => {
    const patterns = [
        { regex: /\bmonday\b|周一|星期一|礼拜一/i, name: 'Monday' },
        { regex: /\btuesday\b|周二|星期二|礼拜二/i, name: 'Tuesday' },
        { regex: /\bwednesday\b|周三|星期三|礼拜三/i, name: 'Wednesday' },
        { regex: /\bthursday\b|周四|星期四|礼拜四/i, name: 'Thursday' },
        { regex: /\bfriday\b|周五|星期五|礼拜五/i, name: 'Friday' },
        { regex: /\bsaturday\b|周六|星期六|礼拜六/i, name: 'Saturday' },
        { regex: /\bsunday\b|周日|周天|星期日|星期天|礼拜日|礼拜天/i, name: 'Sunday' }
    ];

    for (const pattern of patterns) {
        if (pattern.regex.test(text)) return pattern.name;
    }
    return null;
};

const buildHeuristicInterpretation = (text: string) => {
    const vendorTypes = inferVendorTypesFromText(text);
    const dateRange = inferDateRangeFromText(text);
    const dayOfWeek = inferDayOfWeekFromText(text);
    const intentType = inferIntentTypeFromText(text);
    return {
        keywords: text,
        vendorTypes,
        vendorTypeMentioned: inferVendorTypeMentionFromText(text) || vendorTypes.length > 0,
        intentType,
        dateRange: dateRange
            ? {
                startDate: formatDate(dateRange.start),
                endDate: formatDate(dateRange.end)
            }
            : null,
        dayOfWeek,
        location: null
    };
};

const buildKeywordTokens = (keywords: string, queryText: string) => {
    const raw = (keywords || queryText || '').trim();
    if (!raw) return { raw: '', tokens: [] as string[] };
    const tokens = raw
        .toLowerCase()
        .split(/[^a-z0-9\u4e00-\u9fff]+/)
        .filter(Boolean);
    return { raw, tokens };
};

const matchesKeywordTokens = (haystack: string, tokens: string[], raw: string) => {
    if (!raw) return true;
    const lower = haystack.toLowerCase();
    if (tokens.length === 0) {
        return lower.includes(raw.toLowerCase());
    }
    return tokens.some((token) => lower.includes(token));
};

const buildSearchableText = (record: any) => {
    const parts = [
        record?.title,
        record?.description,
        record?.address,
        record?.type
    ];
    if (Array.isArray(record?.tags)) parts.push(record.tags.join(' '));
    if (Array.isArray(record?.categories)) parts.push(record.categories.join(' '));
    return parts.filter(Boolean).join(' ');
};

const FALLBACK_MAX_RESULTS = 50;

const fetchFallbackMarketResults = async ({
    rangeStart,
    rangeEnd,
    dayIndex,
    vendorTypes,
    location,
    keywords,
    queryText
}: {
    rangeStart: Date | null,
    rangeEnd: Date | null,
    dayIndex: number,
    vendorTypes: string[],
    location: string | null,
    keywords: string,
    queryText: string
}) => {
    const hasDateFilter = Boolean(rangeStart && rangeEnd);
    const hasDayFilter = dayIndex >= 0;
    let marketDetails: any[] = [];
    const { raw: keywordRaw, tokens: keywordTokens } = buildKeywordTokens(keywords, queryText);

    if (hasDateFilter) {
        const rangeStartStr = formatDate(rangeStart as Date);
        const rangeEndStr = formatDate(rangeEnd as Date);
        const { data: rangedMarkets } = await supabase
            .from('market_details')
            .select('*')
            .lte('season_start_date', rangeEndStr)
            .gte('season_end_date', rangeStartStr);

        const { data: nullSeasonMarkets } = await supabase
            .from('market_details')
            .select('*')
            .or('season_start_date.is.null,season_end_date.is.null');

        const combined = [...(rangedMarkets || []), ...(nullSeasonMarkets || [])];
        const deduped = new Map();
        combined.forEach((item) => {
            if (item?.opportunity_id) deduped.set(item.opportunity_id, item);
        });
        marketDetails = Array.from(deduped.values());
    } else {
        const { data } = await supabase
            .from('market_details')
            .select('*');
        marketDetails = data || [];
    }

    if (marketDetails.length === 0) return [];

    let filteredMarkets = marketDetails;
    if (hasDateFilter || hasDayFilter) {
        filteredMarkets = filteredMarkets.filter((r: any) => {
            if (hasDateFilter) {
                const seasonStart = parseDate(r.season_start_date || r.start_date);
                const seasonEnd = parseDate(r.season_end_date || r.end_date || r.season_start_date || r.start_date);
                if (seasonStart && seasonEnd) {
                    if (!rangeOverlaps(rangeStart as Date, rangeEnd as Date, seasonStart, seasonEnd)) {
                        return false;
                    }
                } else if (seasonStart || seasonEnd) {
                    const singleDate = seasonStart || seasonEnd;
                    if (singleDate && (singleDate < (rangeStart as Date) || singleDate > (rangeEnd as Date))) {
                        return false;
                    }
                }
            }

            const patternDays = extractPatternDays(r.recurring_pattern);
            if (hasDayFilter) {
                if (patternDays.length > 0 && !patternDays.includes(dayIndex)) return false;
                if (patternDays.length === 0 && rangeStart) {
                    const startDay = (rangeStart as Date).getUTCDay();
                    if (startDay !== dayIndex) return false;
                }
            } else if (hasDateFilter && patternDays.length > 0) {
                const hasOccurrence = patternDays.some((day) =>
                    rangeHasDayOfWeek(rangeStart as Date, rangeEnd as Date, day)
                );
                if (!hasOccurrence) return false;
            }

            return true;
        });
    }

    const ids = filteredMarkets.map((r: any) => r.opportunity_id).filter(Boolean);
    if (ids.length === 0) return [];

    const { data: baseDetails } = await supabase
        .from('sales_opportunities')
        .select('*')
        .in('id', ids);

    const baseMap = new Map();
    (baseDetails || []).forEach((d: any) => baseMap.set(d.id, d));

    let results = filteredMarkets.map((detail: any) => {
        const base = baseMap.get(detail.opportunity_id) || {};
        const tags = mergeTags(base?.tags, detail?.tags);
        return {
            ...base,
            ...detail,
            id: base?.id || detail?.opportunity_id,
            tags,
            similarity: typeof base?.similarity === 'number' ? base.similarity : 0.75
        };
    });

    if (keywordRaw) {
        results = results.filter((r: any) =>
            matchesKeywordTokens(buildSearchableText(r), keywordTokens, keywordRaw)
        );
    }

    if (vendorTypes.length > 0) {
        const vendorTypeTokens = vendorTypes.map(normalizeTagForCompare);
        results = results.filter((r: any) => {
            const tags = Array.isArray(r.tags) ? r.tags : [];
            const tagTokens = new Set(
                tags
                    .filter((tag: unknown): tag is string => typeof tag === 'string')
                    .map(normalizeTagForCompare)
                    .filter(Boolean)
            );
            return vendorTypeTokens.some((token) => tagTokens.has(token));
        });
    }

    if (location) {
        const locationLower = location.toLowerCase();
        results = results.filter((r: any) => {
            const address = typeof r.address === 'string' ? r.address.toLowerCase() : '';
            const title = typeof r.title === 'string' ? r.title.toLowerCase() : '';
            return address.includes(locationLower) || title.includes(locationLower);
        });
    }

    return results.slice(0, FALLBACK_MAX_RESULTS);
};

const fetchFallbackConsignmentResults = async ({
    vendorTypes,
    location,
    keywords,
    queryText
}: {
    vendorTypes: string[],
    location: string | null,
    keywords: string,
    queryText: string
}) => {
    const { raw: keywordRaw, tokens: keywordTokens } = buildKeywordTokens(keywords, queryText);
    const { data: baseDetails } = await supabase
        .from('sales_opportunities')
        .select('*')
        .eq('type', 'CONSIGNMENT')
        .order('created_at', { ascending: false })
        .limit(FALLBACK_MAX_RESULTS);

    const bases = baseDetails || [];
    if (bases.length === 0) return [];

    const ids = bases.map((item: any) => item.id).filter(Boolean);
    const { data: consignmentDetails } = await supabase
        .from('consignment_details')
        .select('*')
        .in('opportunity_id', ids);

    const detailsMap = new Map();
    (consignmentDetails || []).forEach((detail: any) => detailsMap.set(detail.opportunity_id, detail));

    let results = bases.map((base: any) => {
        const detail = detailsMap.get(base.id) || {};
        const tags = mergeTags(base?.tags, detail?.tags);
        return {
            ...base,
            ...detail,
            tags,
            similarity: typeof base?.similarity === 'number' ? base.similarity : 0.72
        };
    });

    if (keywordRaw) {
        results = results.filter((r: any) =>
            matchesKeywordTokens(buildSearchableText(r), keywordTokens, keywordRaw)
        );
    }

    if (vendorTypes.length > 0) {
        const vendorTypeTokens = vendorTypes.map(normalizeTagForCompare);
        results = results.filter((r: any) => {
            const tags = Array.isArray(r.tags) ? r.tags : [];
            const tagTokens = new Set(
                tags
                    .filter((tag: unknown): tag is string => typeof tag === 'string')
                    .map(normalizeTagForCompare)
                    .filter(Boolean)
            );
            return vendorTypeTokens.some((token) => tagTokens.has(token));
        });
    }

    if (location) {
        const locationLower = location.toLowerCase();
        results = results.filter((r: any) => {
            const address = typeof r.address === 'string' ? r.address.toLowerCase() : '';
            const title = typeof r.title === 'string' ? r.title.toLowerCase() : '';
            return address.includes(locationLower) || title.includes(locationLower);
        });
    }

    return results.slice(0, FALLBACK_MAX_RESULTS);
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        // 1. Interpret Query with LLM (fallback to heuristics if unavailable)
        let interpretation: any = {};
        try {
            const interpretationCompletion = await openai.chat.completions.create({
                model: "gpt-5-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are a search query interpreter for Tenbyten. Extract the user's intent.
Output JSON with:
- keywords: string (core topic) or null
- vendorTypes: string[] (must be from the allowed list, otherwise omit)
- vendorTypeMentioned: boolean (true only if the user describes what they sell or their vendor category)
- intentType: "MARKET" | "CONSIGNMENT" | "ANY"
- dateRange: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" } or nulls
- dayOfWeek: string (Full English Name, e.g. "Sunday") ONLY if the user explicitly mentions a specific day of the week.
- location: string if mentioned, else null.

Allowed vendor types: Farm, Vintage, Booth, Processor, Importer, Food Truck, Community, Craft, Hot Food, Non-Profit.

Mapping hints (English + Chinese):
- 卖衣服/服装/衣服/古着/复古/二手 => Vintage
- 摆摊/摊位 => Booth
- 手作/手工/文创 => Craft
- 农场/农产品 => Farm
- 加工/加工食品 => Processor
- 进口/海淘 => Importer
- 餐车/美食车 => Food Truck
- 社区/邻里 => Community
- 热食/熟食/现做 => Hot Food
- 非营利/公益/慈善 => Non-Profit

Rules:
- If no vendor type is clearly present, return vendorTypes: []
- If the user describes what they sell or their vendor category, vendorTypeMentioned must be true (even if vendorTypes is empty).
- If user says "market/市集/Market", intentType = "MARKET"; if "consignment/寄卖/二手店", intentType = "CONSIGNMENT"; otherwise "ANY".
- "next week/下周" => dateRange is next Monday to next Sunday relative to today.
- "weekend/周末" => dateRange is the upcoming Saturday to Sunday relative to today.
Today is ${new Date().toISOString().split('T')[0]}.`
                    },
                    { role: "user", content: query }
                ],
                response_format: { type: "json_object" }
            });

            const interpretationStr = interpretationCompletion.choices[0].message.content;
            try {
                interpretation = interpretationStr ? JSON.parse(interpretationStr) : {};
            } catch (parseError) {
                console.warn("⚠️ [AI Search] Failed to parse interpretation JSON:", parseError);
            }
        } catch (llmError) {
            console.warn("⚠️ [AI Search] LLM interpretation failed, using heuristic fallback:", llmError);
        }

        const heuristicInterpretation = buildHeuristicInterpretation(query);
        const interpretationHasDateRange = Boolean(
            interpretation?.dateRange && (interpretation.dateRange.startDate || interpretation.dateRange.endDate)
        );
        interpretation = {
            keywords: typeof interpretation.keywords === 'string' && interpretation.keywords.trim()
                ? interpretation.keywords
                : heuristicInterpretation.keywords,
            vendorTypes: Array.isArray(interpretation.vendorTypes) && interpretation.vendorTypes.length > 0
                ? interpretation.vendorTypes
                : heuristicInterpretation.vendorTypes,
            vendorTypeMentioned: typeof interpretation.vendorTypeMentioned === 'boolean'
                ? interpretation.vendorTypeMentioned
                : heuristicInterpretation.vendorTypeMentioned,
            intentType: typeof interpretation.intentType === 'string'
                ? interpretation.intentType
                : heuristicInterpretation.intentType,
            dateRange: interpretationHasDateRange
                ? interpretation.dateRange
                : heuristicInterpretation.dateRange,
            dayOfWeek: typeof interpretation.dayOfWeek === 'string'
                ? interpretation.dayOfWeek
                : heuristicInterpretation.dayOfWeek,
            location: typeof interpretation.location === 'string'
                ? interpretation.location
                : heuristicInterpretation.location
        };

        console.log("🤖 [AI Search] Interpretation:", JSON.stringify(interpretation, null, 2));
        const keywords = typeof interpretation.keywords === 'string' ? interpretation.keywords : '';
        const rawVendorTypes = toArray(interpretation.vendorTypes);
        const inferredVendorTypes = rawVendorTypes
            .map((type) => (typeof type === 'string' ? normalizeVendorType(type) : null))
            .filter((type): type is string => Boolean(type));
        const fallbackVendorTypes = inferredVendorTypes.length > 0
            ? inferredVendorTypes
            : inferVendorTypesFromText(query);
        const vendorTypes = Array.from(new Set(fallbackVendorTypes));

        const vendorTypeMentionedRaw = interpretation.vendorTypeMentioned;
        const vendorTypeMentionedFromLLM = typeof vendorTypeMentionedRaw === 'boolean'
            ? vendorTypeMentionedRaw
            : (typeof vendorTypeMentionedRaw === 'string'
                ? ['true', 'yes', '1'].includes(vendorTypeMentionedRaw.toLowerCase())
                : false);
        const vendorTypeMentioned = vendorTypeMentionedFromLLM
            || vendorTypes.length > 0
            || inferVendorTypeMentionFromText(query);

        if (vendorTypeMentioned && vendorTypes.length === 0) {
            return NextResponse.json({
                results: [],
                meta: { ...interpretation, vendorTypes, vendorTypeMentioned }
            });
        }

        const intentTypeRaw = typeof interpretation.intentType === 'string' ? interpretation.intentType : 'ANY';
        const intentType = ['MARKET', 'CONSIGNMENT'].includes(intentTypeRaw.toUpperCase())
            ? intentTypeRaw.toUpperCase()
            : 'ANY';

        const dayOfWeekRaw = typeof interpretation.dayOfWeek === 'string' ? interpretation.dayOfWeek : null;
        const dayIndex = dayOfWeekRaw ? WEEKDAYS.indexOf(dayOfWeekRaw.toLowerCase()) : -1;

        const location = typeof interpretation.location === 'string' ? interpretation.location : null;
        const dateRange = interpretation.dateRange || {};
        let rangeStart = parseDate(dateRange.startDate) || parseDate(interpretation.targetDate);
        let rangeEnd = parseDate(dateRange.endDate) || parseDate(interpretation.targetDate);

        if (!rangeStart || !rangeEnd) {
            const inferredRange = inferDateRangeFromText(query);
            if (inferredRange) {
                rangeStart = rangeStart || inferredRange.start;
                rangeEnd = rangeEnd || inferredRange.end;
            }
        }

        if (rangeStart && !rangeEnd) rangeEnd = rangeStart;
        if (!rangeStart && rangeEnd) rangeStart = rangeEnd;
        if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
            const temp = rangeStart;
            rangeStart = rangeEnd;
            rangeEnd = temp;
        }

        // 2. Generate Embedding for the Keywords (or full query if no keywords)
        const textToEmbed = keywords
            ? `${keywords} ${vendorTypes.join(' ')}`.trim()
            : query;

        let vectorResults: any[] = [];
        try {
            const embedding = await generateEmbedding(textToEmbed);

            // 3. Call RPC for Vector Search
            console.log("🔍 [AI Search] Executing Vector Search...");
            const { data, error } = await supabase
                .rpc('match_opportunities', {
                    query_embedding: embedding,
                    match_threshold: 0.1, // Lower threshold to ensure results
                    match_count: 20
                });

            if (error) {
                console.error("❌ [AI Search] Vector search error:", error);
                throw error;
            }

            vectorResults = data || [];
            console.log(`✅ [AI Search] Vector Search found ${vectorResults.length} raw matches.`);
        } catch (vectorError) {
            console.warn("⚠️ [AI Search] Vector search skipped, using fallback:", vectorError);
        }

        let results = vectorResults || [];

        // 4. Post-processing Filter & Merge Details
        if (results.length > 0) {
            const ids = results.map((r: any) => r.id);

            const { data: baseDetails } = await supabase
                .from('sales_opportunities')
                .select('id, tags, address')
                .in('id', ids);

            const baseDetailsMap = new Map();
            if (baseDetails) baseDetails.forEach((d: any) => baseDetailsMap.set(d.id, d));

            // Fetch Market Details
            const { data: marketDetails } = await supabase
                .from('market_details')
                .select('*') // Fetch ALL details for UI
                .in('opportunity_id', ids);

            // Fetch Consignment Details (if any shop types exist)
            const { data: consignmentDetails } = await supabase
                .from('consignment_details')
                .select('*')
                .in('opportunity_id', ids);

            const detailsMap = new Map();
            if (marketDetails) marketDetails.forEach((d: any) => detailsMap.set(d.opportunity_id, d));
            if (consignmentDetails) consignmentDetails.forEach((d: any) => detailsMap.set(d.opportunity_id, d));

            results = results.map((r: any) => {
                const baseDetail = baseDetailsMap.get(r.id);
                const detail = detailsMap.get(r.id);
                // Merge detail into result
                const merged = { ...baseDetail, ...r, ...detail };
                const tags = mergeTags(baseDetail?.tags, detail?.tags);
                return { ...merged, tags };
            });

            if (intentType !== 'ANY') {
                results = results.filter((r: any) => r.type === intentType);
            }

            if (vendorTypes.length > 0) {
                const vendorTypeTokens = vendorTypes.map(normalizeTagForCompare);
                results = results.filter((r: any) => {
                    const tags = Array.isArray(r.tags) ? r.tags : [];
                    const tagTokens = new Set(
                        tags
                            .filter((tag: unknown): tag is string => typeof tag === 'string')
                            .map(normalizeTagForCompare)
                            .filter(Boolean)
                    );
                    return vendorTypeTokens.some((token) => tagTokens.has(token));
                });
            }

            if (location) {
                const locationLower = location.toLowerCase();
                results = results.filter((r: any) => {
                    const address = typeof r.address === 'string' ? r.address.toLowerCase() : '';
                    const title = typeof r.title === 'string' ? r.title.toLowerCase() : '';
                    return address.includes(locationLower) || title.includes(locationLower);
                });
            }

            const hasDateFilter = Boolean(rangeStart && rangeEnd);
            const hasDayFilter = dayIndex >= 0;
            if (hasDateFilter || hasDayFilter) {
                console.log(`📅 [AI Search] Filtering against Date Range: ${rangeStart?.toISOString().split('T')[0]} to ${rangeEnd?.toISOString().split('T')[0]}`);
                results = results.filter((r: any) => {
                    if (r.type !== 'MARKET') return true;

                    if (hasDateFilter) {
                        const seasonStart = parseDate(r.season_start_date || r.start_date);
                        const seasonEnd = parseDate(r.season_end_date || r.end_date || r.season_start_date || r.start_date);
                        if (seasonStart && seasonEnd) {
                            if (!rangeOverlaps(rangeStart as Date, rangeEnd as Date, seasonStart, seasonEnd)) {
                                return false;
                            }
                        } else if (seasonStart || seasonEnd) {
                            const singleDate = seasonStart || seasonEnd;
                            if (singleDate && (singleDate < (rangeStart as Date) || singleDate > (rangeEnd as Date))) {
                                return false;
                            }
                        }
                    }

                    const patternDays = extractPatternDays(r.recurring_pattern);
                    if (hasDayFilter) {
                        if (patternDays.length > 0 && !patternDays.includes(dayIndex)) return false;
                        if (patternDays.length === 0 && rangeStart) {
                            const startDay = (rangeStart as Date).getUTCDay();
                            if (startDay !== dayIndex) return false;
                        }
                    } else if (hasDateFilter && patternDays.length > 0) {
                        const hasOccurrence = patternDays.some((day) =>
                            rangeHasDayOfWeek(rangeStart as Date, rangeEnd as Date, day)
                        );
                        if (!hasOccurrence) return false;
                    }

                    return true;
                });
            }
        }

        if (results.length === 0) {
            const fallbackResults: any[] = [];

            if (intentType !== 'CONSIGNMENT') {
                const marketFallback = await fetchFallbackMarketResults({
                    rangeStart,
                    rangeEnd,
                    dayIndex,
                    vendorTypes,
                    location,
                    keywords,
                    queryText: query
                });
                fallbackResults.push(...marketFallback);
            }

            if (intentType !== 'MARKET') {
                const consignmentFallback = await fetchFallbackConsignmentResults({
                    vendorTypes,
                    location,
                    keywords,
                    queryText: query
                });
                fallbackResults.push(...consignmentFallback);
            }

            if (fallbackResults.length > 0) {
                const deduped = new Map();
                fallbackResults.forEach((item) => {
                    if (item?.id) deduped.set(item.id, item);
                });
                results = Array.from(deduped.values());
            }
        }



        console.log(`🚀 [AI Search] Final Results: ${results.length} items`);

        return NextResponse.json({
            results: results.slice(0, 5), // Return top 5 after filtering
            meta: {
                ...interpretation,
                vendorTypes,
                vendorTypeMentioned,
                intentType,
                dateRange: rangeStart && rangeEnd
                    ? {
                        startDate: rangeStart.toISOString().split('T')[0],
                        endDate: rangeEnd.toISOString().split('T')[0]
                    }
                    : interpretation.dateRange
            }
        });

    } catch (err: any) {
        console.error('Search error:', err);
        return NextResponse.json(
            { error: 'Search failed', details: err.message },
            { status: 500 }
        );
    }
}
