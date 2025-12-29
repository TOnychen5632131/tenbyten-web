import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(req: NextRequest) {
    try {
        console.log('Starting database backup...');
        const tables = [
            'invite_codes',
            'vendor_profiles',
            'sales_opportunities',
            'market_details',
            'consignment_details',
            'opportunity_reviews'
        ];

        const backupData: Record<string, any[]> = {};

        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*');

            if (error) {
                console.error(`Error backing up ${table}:`, error);
                backupData[table] = [{ error: error.message }];
            } else {
                backupData[table] = data || [];
            }
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.json`;

        return new NextResponse(JSON.stringify(backupData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
