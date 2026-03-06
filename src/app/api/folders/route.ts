import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth';

export async function GET() {
    try {
        const { supabase } = await getAuthClient();
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { supabase } = await getAuthClient();
        const { name } = await req.json();

        const { data, error } = await supabase
            .from('folders')
            .insert({ name })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
