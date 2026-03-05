require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('generations').select('id, type, status, metadata, error_message, updated_at').eq('type', 'video').order('updated_at', { ascending: false }).limit(5).then(res => console.log(JSON.stringify(res.data, null, 2)));
