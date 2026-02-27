import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
        .from('actors')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const supabase = createServerSupabaseClient();
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
}
