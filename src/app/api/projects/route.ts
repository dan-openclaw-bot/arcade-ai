import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
        .from('projects')
        .select('*, folder:folders(id, name)')
        .order('updated_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const supabase = createServerSupabaseClient();
    const body = await req.json();
    const { name, folder_id } = body;

    const { data, error } = await supabase
        .from('projects')
        .insert({ name, folder_id: folder_id || null })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
