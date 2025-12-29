
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Simple .env parser to avoid dependencies
const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, ''); // toggle quotes
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            });
            console.log('Loaded .env.local');
        } else {
            console.log('No .env.local found, relying on process.env');
        }
    } catch (e) {
        console.error('Error loading .env.local', e);
    }
};

loadEnv();

const TABLES = [
    'sales_opportunities',
    'market_details',
    'consignment_details',
    'opportunity_reviews',
    'vendor_profiles',
    'invite_codes'
];

const runBackup = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url) {
        console.error('Error: NEXT_PUBLIC_SUPABASE_URL is missing.');
        process.exit(1);
    }

    const keyInfo = serviceKey ? "Service Role Key (Full Access)" : "Anon Key (RLS Restricted)";
    console.log(`Initializing Supabase client with ${keyInfo}...`);

    // Use Service Key if available for full backup, else Anon Key
    const supabase = createClient(url, serviceKey || anonKey || '');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', timestamp);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Starting backup to ${backupDir}...`);

    for (const table of TABLES) {
        console.log(`Fetching ${table}...`);
        try {
            const { data, error } = await supabase.from(table).select('*');

            if (error) {
                console.error(`Error fetching ${table}:`, error.message);
                // Continue to next table
                continue;
            }

            if (data) {
                const filePath = path.join(backupDir, `${table}.json`);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`Saved ${data.length} rows to ${table}.json`);
            }
        } catch (err: any) {
            console.error(`Unexpected error backing up ${table}:`, err.message);
        }
    }

    console.log('Backup completed successfully.');
};

runBackup().catch(console.error);
