import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_EYRONIX_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// We need the SERVICE ROLE KEY (admin key) to bypass RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('Make sure you have SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearOrders() {
    console.log('Connecting to Supabase...');
    console.log(`URL: ${supabaseUrl}`);

    // Check if we can connect
    const { error: healthError } = await supabase.from('sales').select('count', { count: 'exact', head: true });
    if (healthError) {
        console.error('Connection failed:', healthError);
        return;
    }

    console.log('Deleting all orders from "sales" table...');

    // Delete all rows where id is not null (effectively all rows)
    const { error, count } = await supabase
        .from('sales')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

    if (error) {
        console.error('Error deleting orders:', error);
    } else {
        console.log('All orders deleted successfully.');
    }
}

clearOrders();
