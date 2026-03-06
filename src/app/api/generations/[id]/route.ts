import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { supabase } = await getAuthClient();
        const { error } = await supabase.from('generations').delete().eq('id', params.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { supabase } = await getAuthClient();
        const { data, error } = await supabase
            .from('generations')
            .select('*, preprompt:preprompts(id, name, content), actor:actors(id, name, image_url)')
            .eq('id', params.id)
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
