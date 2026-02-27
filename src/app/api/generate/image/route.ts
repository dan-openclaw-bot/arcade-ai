import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateImages } from '@/lib/gemini';
import { IMAGE_MODELS } from '@/lib/types';

export async function POST(req: NextRequest) {
    const supabase = createServerSupabaseClient();

    try {
        const body = await req.json();
        const {
            project_id,
            prompt,
            model,
            aspect_ratio = '1:1',
            count = 1,
            preprompt_id,
            actor_id,
            reference_image_url,
        } = body;

        if (!project_id || !prompt || !model) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate model exists
        const modelInfo = IMAGE_MODELS.find((m) => m.id === model);
        if (!modelInfo) {
            return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
        }

        // Build final prompt with preprompt if given
        let finalPrompt = prompt;
        if (preprompt_id) {
            const { data: preprompt } = await supabase
                .from('preprompts')
                .select('content')
                .eq('id', preprompt_id)
                .single();
            if (preprompt?.content) {
                finalPrompt = `${preprompt.content}\n\n${prompt}`;
            }
        }

        // Create placeholder generation records
        const generationInserts = Array.from({ length: count }, () => ({
            project_id,
            type: 'image',
            prompt,
            preprompt_id: preprompt_id || null,
            actor_id: actor_id || null,
            model,
            aspect_ratio,
            status: 'generating',
            metadata: { model_name: modelInfo.name },
        }));

        const { data: records, error: insertError } = await supabase
            .from('generations')
            .insert(generationInserts)
            .select();

        if (insertError || !records) {
            return NextResponse.json({ error: insertError?.message || 'Insert failed' }, { status: 500 });
        }

        // Generate images via Gemini
        let images: { base64: string; mimeType: string }[] = [];
        try {
            images = await generateImages(finalPrompt, model, count, aspect_ratio, reference_image_url);
        } catch (genError: unknown) {
            // Mark all as error
            await supabase
                .from('generations')
                .update({ status: 'error', error_message: String(genError), updated_at: new Date().toISOString() })
                .in('id', records.map((r) => r.id));

            return NextResponse.json({ error: String(genError) }, { status: 500 });
        }

        // Upload each image to Supabase storage + update DB record
        const updatedRecords = await Promise.all(
            records.map(async (record, idx) => {
                const imageData = images[idx];
                if (!imageData?.base64) {
                    await supabase
                        .from('generations')
                        .update({ status: 'error', error_message: 'No image data returned', updated_at: new Date().toISOString() })
                        .eq('id', record.id);
                    return { ...record, status: 'error' };
                }

                // Convert base64 to Buffer for upload
                const buffer = Buffer.from(imageData.base64, 'base64');
                const ext = imageData.mimeType === 'image/png' ? 'png' : 'jpg';
                const filename = `${project_id}/${record.id}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from('generations')
                    .upload(filename, buffer, {
                        contentType: imageData.mimeType,
                        upsert: true,
                    });

                if (uploadError) {
                    await supabase
                        .from('generations')
                        .update({ status: 'error', error_message: uploadError.message, updated_at: new Date().toISOString() })
                        .eq('id', record.id);
                    return { ...record, status: 'error' };
                }

                const { data: publicUrl } = supabase.storage.from('generations').getPublicUrl(filename);

                const { data: updated } = await supabase
                    .from('generations')
                    .update({
                        status: 'done',
                        output_url: publicUrl.publicUrl,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', record.id)
                    .select()
                    .single();

                return updated || { ...record, status: 'done' };
            })
        );

        return NextResponse.json({ generations: updatedRecords }, { status: 201 });
    } catch (err: unknown) {
        console.error('Generate image error:', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
