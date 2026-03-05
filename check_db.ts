import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvuocbofomfofswowqiy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('generations')
        .select('id, type, status, metadata, error_message, updated_at')
        .eq('type', 'video')
        .order('updated_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

check();
