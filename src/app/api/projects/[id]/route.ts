import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
        .from('projects')
        .select('*, folder:folders(id, name)')
        .eq('id', params.id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createServerSupabaseClient();
    const body = await req.json();

    const { data, error } = await supabase
        .from('projects')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('projects').delete().eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
