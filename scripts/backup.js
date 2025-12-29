const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to load env vars from .env.local
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return;
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/"/g, '');
            }
        });
    } catch (e) {
        console.error('Error loading .env.local', e);
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
    'invite_codes',
    'vendor_profiles',
    'sales_opportunities',
    'market_details',
    'consignment_details',
    'opportunity_reviews'
];

async function backup() {
    console.log('Starting backup to local file...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const outputPath = path.join(process.cwd(), 'backups', filename);

    const backupData = {};

    for (const table of TABLES) {
        process.stdout.write(`Fetching ${table}... `);
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`\nError fetching ${table}:`, error.message);
            backupData[table] = { error: error.message };
        } else {
            console.log(`Done (${data.length} records)`);
            backupData[table] = data;
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2));
    console.log(`\nBackup saved successfully to: ${outputPath}`);
}

backup();
