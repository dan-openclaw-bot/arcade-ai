import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');

    let query = supabase
        .from('generations')
        .select('*, preprompt:preprompts(id, name, content), actor:actors(id, name, image_url)')
        .order('created_at', { ascending: false });

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const supabase = createServerSupabaseClient();
    const body = await req.json();

    const { data, error } = await supabase
        .from('generations')
        .insert({
            project_id: body.project_id,
            type: body.type,
            prompt: body.prompt,
            preprompt_id: body.preprompt_id || null,
            actor_id: body.actor_id || null,
            model: body.model,
            aspect_ratio: body.aspect_ratio,
            duration_seconds: body.duration_seconds || null,
            resolution: body.resolution || null,
            status: 'pending',
            metadata: body.metadata || {},
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
