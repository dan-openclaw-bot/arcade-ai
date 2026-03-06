import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth';

export async function GET() {
    try {
        const { supabase } = await getAuthClient();
        const { data, error } = await supabase
            .from('actors')
            .select('*')
            .order('created_at', { ascending: false });

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

        const { data, error } = await supabase
            .from('actors')
            .insert({
                name: body.name,
                description: body.description || '',
                image_url: body.image_url,
            })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
