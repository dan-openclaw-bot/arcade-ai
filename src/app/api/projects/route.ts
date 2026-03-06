import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth';

export async function GET() {
    try {
        const { supabase } = await getAuthClient();
        const { data, error } = await supabase
            .from('projects')
            .select('*, folder:folders(id, name)')
            .order('updated_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { supabase } = await getAuthClient();
        const body = await req.json();
        const { name, folder_id } = body;

        const { data, error } = await supabase
            .from('projects')
            .insert({ name, folder_id: folder_id || null })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
