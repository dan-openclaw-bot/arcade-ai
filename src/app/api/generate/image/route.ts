export const maxDuration = 300;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthClient, getApiKey, isAdmin } from '@/lib/auth';
import { generateSingleImage } from '@/lib/gemini';
import { IMAGE_MODELS } from '@/lib/types';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isCapacityErrorMessage(message: string): boolean {
    const lower = message.toLowerCase();
    return (
        lower.includes('resource exhausted')
        || lower.includes('resource has been exhausted')
        || lower.includes('quota')
        || lower.includes('capacity')
        || lower.includes('too many requests')
        || lower.includes('429')
        || lower.includes('503')
    );
}

function formatGenerationError(error: unknown): string {
    const message = getErrorMessage(error);
    if (isCapacityErrorMessage(message)) {
        return 'Google image capacity is temporarily saturated. Automatic retries were exhausted; please try again in a moment.';
    }
    return message;
}

function getImageGenerationConcurrency(model: string): number {
    if (model === 'gemini-3-pro-image-preview') return 1;
    if (model.startsWith('gemini-')) return 2;
    return 4;
}

async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let cursor = 0;

    async function runNext(): Promise<void> {
        const index = cursor;
        cursor += 1;

        if (index >= items.length) return;

        results[index] = await worker(items[index], index);
        await runNext();
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, () => runNext())
    );

    return results;
}

export async function POST(req: NextRequest) {
    try {
        const { user, supabase } = await getAuthClient();

        // Admin uses Vertex AI (no API key needed), users need their own key
        const adminUser = isAdmin(user.id);
        const googleKey = adminUser ? null : getApiKey(req, 'google', user.id);
        if (!adminUser && !googleKey) {
            return NextResponse.json({ error: 'Google API key required. Set it in Settings.', missingKeyProvider: 'google' }, { status: 400 });
        }

        const body = await req.json();
        const {
            project_id,
            prompt,
            model,
            aspect_ratio = '1:1',
            count = 1,
            client_request_id,
            preprompt_id,
            preprompt_override,
            actor_id,
            reference_image_urls,
            quality_suffix,
            negative_prompt,
        } = body;

        if (!project_id || !prompt || !model) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate model exists
        const modelInfo = IMAGE_MODELS.find((m) => m.id === model);
        if (!modelInfo) {
            return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
        }

        const generationConcurrency = Math.min(getImageGenerationConcurrency(model), count);

        // Build final prompt with preprompt if given
        let finalPrompt = prompt;
        const prepromptOverride = typeof preprompt_override === 'string' ? preprompt_override.trim() : '';

        if (prepromptOverride) {
            finalPrompt = `${prepromptOverride}\n\n${prompt}`;
        } else if (preprompt_id) {
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
        const generationInserts = Array.from({ length: count }, (_, index) => ({
            project_id,
            type: 'image',
            prompt,
            preprompt_id: preprompt_id || null,
            actor_id: actor_id || null,
            model,
            aspect_ratio,
            status: index < generationConcurrency ? 'generating' : 'pending',
            metadata: {
                model_name: modelInfo.name,
                ...(client_request_id ? {
                    client_request_id,
                    client_request_index: index,
                } : {}),
            },
        }));

        const { data: records, error: insertError } = await supabase
            .from('generations')
            .insert(generationInserts)
            .select();

        if (insertError || !records) {
            return NextResponse.json({ error: insertError?.message || 'Insert failed' }, { status: 500 });
        }

        const serviceSupabase = createServerSupabaseClient();

        const updatedRecords = await mapWithConcurrency(
            records,
            generationConcurrency,
            async (record) => {
                try {
                    if (record.status === 'pending') {
                        await supabase
                            .from('generations')
                            .update({ status: 'generating', updated_at: new Date().toISOString() })
                            .eq('id', record.id);
                    }

                    const imageData = await generateSingleImage(
                        finalPrompt, model, aspect_ratio,
                        reference_image_urls || [], quality_suffix, negative_prompt, googleKey || undefined
                    );

                    if (!imageData?.base64) {
                        await supabase
                            .from('generations')
                            .update({ status: 'error', error_message: 'No image data returned', updated_at: new Date().toISOString() })
                            .eq('id', record.id);
                        return { ...record, status: 'error' };
                    }

                    // Upload immediately after THIS image is generated
                    const buffer = Buffer.from(imageData.base64, 'base64');
                    const ext = imageData.mimeType === 'image/png' ? 'png' : 'jpg';
                    const filename = `${project_id}/${record.id}.${ext}`;

                    const { error: uploadError } = await serviceSupabase.storage
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

                    const { data: publicUrl } = serviceSupabase.storage.from('generations').getPublicUrl(filename);

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
                } catch (genError: unknown) {
                    const errorMessage = formatGenerationError(genError);
                    await supabase
                        .from('generations')
                        .update({ status: 'error', error_message: errorMessage, updated_at: new Date().toISOString() })
                        .eq('id', record.id);
                    return { ...record, status: 'error', error_message: errorMessage };
                }
            }
        );

        return NextResponse.json({ generations: updatedRecords }, { status: 201 });
    } catch (err: unknown) {
        console.error('Generate image error:', err);
        if (String(err).includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
