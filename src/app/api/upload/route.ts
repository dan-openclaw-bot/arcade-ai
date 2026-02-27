import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Upload an image file for actors or reference images
export async function POST(req: NextRequest) {
    const supabase = createServerSupabaseClient();

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const bucket = (formData.get('bucket') as string) || 'actors';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(filename);

        return NextResponse.json({ url: publicUrl.publicUrl }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
