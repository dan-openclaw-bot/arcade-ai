import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { supabase } = await getAuthClient();
        const { data, error } = await supabase
            .from('projects')
            .select('*, folder:folders(id, name)')
            .eq('id', params.id)
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { supabase } = await getAuthClient();
        const body = await req.json();

        const { data, error } = await supabase
            .from('projects')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', params.id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { supabase } = await getAuthClient();
        const { error } = await supabase.from('projects').delete().eq('id', params.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
