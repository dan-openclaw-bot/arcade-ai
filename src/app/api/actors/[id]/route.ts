import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { supabase } = await getAuthClient();
        const { error } = await supabase.from('actors').delete().eq('id', params.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { supabase } = await getAuthClient();
        const body = await req.json();
        const { data, error } = await supabase
            .from('actors')
            .update(body)
            .eq('id', params.id)
            .select()
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
