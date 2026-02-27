import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('preprompts').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createServerSupabaseClient();
    const body = await req.json();
    const { data, error } = await supabase
        .from('preprompts')
        .update(body)
        .eq('id', params.id)
        .select()
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
