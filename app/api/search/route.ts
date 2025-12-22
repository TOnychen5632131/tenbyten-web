
import { NextRequest, NextResponse } from 'next/server';
import { generateSearchResults } from '@/utils/openai';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 });
        }

        // Mock response for testing UI
        if (query === '搜索' || query.toLowerCase() === 'search' || query === '测试') {
            return NextResponse.json({
                success: true,
                results: [
                    {
                        id: 'mock-1',
                        title: 'Frontend Demo Market',
                        description: 'This is a demonstration of the search result UI card. It shows how the title, description, and tags appear.',
                        type: 'MARKET',
                        similarity: 0.99
                    },
                    {
                        id: 'mock-2',
                        title: 'Example Booth Opportunity',
                        description: 'Another sample result to show the grid layout. Great location near the entrance with high foot traffic.',
                        type: 'BOOTH',
                        similarity: 0.85
                    }
                ]
            });
        }

        console.log('Generating AI results for:', query);

        // Use AI to generate relevant results instead of database search
        const results = await generateSearchResults(query);

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Search API failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
