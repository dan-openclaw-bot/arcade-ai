import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getApiKey, getProviderForModel } from '@/lib/auth';
import { generateVideo } from '@/lib/gemini';
import { generateSoraVideo } from '@/lib/openai';
import { VIDEO_MODELS } from '@/lib/types';

function isSoraModel(model: string): boolean {
    return model.startsWith('sora-');
}

export async function POST(req: NextRequest) {
    try {
        const { user, supabase } = await getAuthClient();

        const body = await req.json();
        const {
            project_id,
            prompt,
            model,
            aspect_ratio = '9:16',
            duration_seconds = 8,
            resolution = '1080p',
            count = 1,
            preprompt_id,
            actor_id,
            reference_image_url,
        } = body;

        if (!project_id || !prompt || !model) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get API key for the right provider
        const provider = getProviderForModel(model);
        const apiKey = getApiKey(req, provider, user.id);
        if (!apiKey) {
            return NextResponse.json({ error: `${provider === 'openai' ? 'OpenAI' : 'Google'} API key required. Set it in Settings.` }, { status: 400 });
        }

        const modelInfo = VIDEO_MODELS.find((m) => m.id === model);
        if (!modelInfo) {
            return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
        }

        // Build final prompt
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

        // Insert generation records (one per count)
        const inserts = Array.from({ length: count }, () => ({
            project_id,
            type: 'video',
            prompt,
            preprompt_id: preprompt_id || null,
            actor_id: actor_id || null,
            model,
            aspect_ratio,
            duration_seconds,
            resolution,
            status: 'generating',
            metadata: { model_name: modelInfo.name },
        }));

        const { data: records, error: insertError } = await supabase
            .from('generations')
            .insert(inserts)
            .select();

        if (insertError || !records) {
            return NextResponse.json({ error: insertError?.message }, { status: 500 });
        }

        try {
            if (isSoraModel(model)) {
                // ---- SORA 2 / SORA 2 PRO ----
                let refImageBase64: string | undefined;
                if (reference_image_url) {
                    try {
                        const imgResponse = await fetch(reference_image_url);
                        const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
                        refImageBase64 = imgBuffer.toString('base64');
                    } catch (e) {
                        console.error('Failed to download reference image for Sora:', e);
                    }
                }

                const { videoId } = await generateSoraVideo(
                    finalPrompt,
                    model,
                    aspect_ratio,
                    duration_seconds,
                    refImageBase64,
                    apiKey,
                );

                // Store video ID in metadata for polling
                await supabase
                    .from('generations')
                    .update({
                        metadata: { model_name: modelInfo.name, sora_video_id: videoId, provider: 'openai' },
                        updated_at: new Date().toISOString(),
                    })
                    .in('id', records.map((r) => r.id));

                return NextResponse.json({ generations: records, sora_video_id: videoId }, { status: 201 });

            } else {
                // ---- VEO / GEMINI VIDEO ----
                const { operationName } = await generateVideo(
                    finalPrompt,
                    model,
                    aspect_ratio,
                    duration_seconds,
                    reference_image_url,
                    apiKey,
                );

                // Store operation name in metadata for polling
                await supabase
                    .from('generations')
                    .update({
                        metadata: { model_name: modelInfo.name, operation_name: operationName },
                        updated_at: new Date().toISOString(),
                    })
                    .in('id', records.map((r) => r.id));

                return NextResponse.json({ generations: records, operation_name: operationName }, { status: 201 });
            }
        } catch (genError: unknown) {
            await supabase
                .from('generations')
                .update({ status: 'error', error_message: String(genError), updated_at: new Date().toISOString() })
                .in('id', records.map((r) => r.id));

            return NextResponse.json({ error: String(genError) }, { status: 500 });
        }
    } catch (err: unknown) {
        if (String(err).includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
