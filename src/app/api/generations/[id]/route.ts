import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('generations').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
        .from('generations')
        .select('*, preprompt:preprompts(id, name, content), actor:actors(id, name, image_url)')
        .eq('id', params.id)
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
}
