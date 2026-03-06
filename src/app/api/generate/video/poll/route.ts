export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes to allow for downloading and uploading 10MB+ video buffers

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { pollVideoOperation } from '@/lib/gemini';
import { pollSoraVideo } from '@/lib/openai';

/**
 * GET /api/generate/video/poll
 * Called periodically to check and update status of generating videos.
 * Uses service role client (bypasses RLS) since it needs to poll all users' videos.
 * API keys come from request headers.
 */
export async function GET(req: NextRequest) {
    const supabase = createServerSupabaseClient();

    // Get API keys from headers (user's own keys)
    const openaiKey = req.headers.get('x-openai-key') || process.env.OPENAI_API_KEY || undefined;
    const googleKey = req.headers.get('x-google-key') || process.env.GEMINI_API_KEY || undefined;

    // Find all generating videos
    const { data: generatingVideos, error } = await supabase
        .from('generations')
        .select('*')
        .eq('type', 'video')
        .eq('status', 'generating');

    if (error || !generatingVideos) {
        return NextResponse.json({ error: error?.message || 'Failed to fetch' }, { status: 500 });
    }

    const updatedIds: string[] = [];

    for (const gen of generatingVideos) {
        const metadata = gen.metadata || {};

        try {
            if (metadata.provider === 'openai' && metadata.sora_video_id) {
                // ---- SORA ----
                const result = await pollSoraVideo(metadata.sora_video_id, openaiKey);
                if (result.done && result.videoBase64) {
                    // Upload video to Supabase storage
                    const buffer = Buffer.from(result.videoBase64, 'base64');
                    const fileName = `video_${gen.id}_${Date.now()}.mp4`;
                    const { error: uploadError } = await supabase.storage
                        .from('generations')
                        .upload(fileName, buffer, { contentType: 'video/mp4' });

                    if (uploadError) {
                        console.error('Supabase upload error:', uploadError);
                        await supabase
                            .from('generations')
                            .update({ status: 'error', error_message: `Upload failed: ${uploadError.message}`, updated_at: new Date().toISOString() })
                            .eq('id', gen.id);
                    } else {
                        const { data: urlData } = supabase.storage.from('generations').getPublicUrl(fileName);
                        await supabase
                            .from('generations')
                            .update({
                                status: 'done',
                                output_url: urlData.publicUrl,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', gen.id);
                        updatedIds.push(gen.id);
                    }
                } else if (result.done && !result.videoBase64) {
                    await supabase
                        .from('generations')
                        .update({ status: 'error', error_message: 'Video completed but no data', updated_at: new Date().toISOString() })
                        .eq('id', gen.id);
                }

            } else if (metadata.operation_name) {
                // ---- VEO ----
                const result = await pollVideoOperation(metadata.operation_name, googleKey);
                if (result.done && result.videoBase64) {
                    const buffer = Buffer.from(result.videoBase64, 'base64');
                    const fileName = `video_${gen.id}_${Date.now()}.mp4`;
                    const { error: uploadError } = await supabase.storage
                        .from('generations')
                        .upload(fileName, buffer, { contentType: 'video/mp4' });

                    if (!uploadError) {
                        const { data: urlData } = supabase.storage.from('generations').getPublicUrl(fileName);
                        await supabase
                            .from('generations')
                            .update({
                                status: 'done',
                                output_url: urlData.publicUrl,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', gen.id);
                        updatedIds.push(gen.id);
                    }
                } else if (result.done && !result.videoBase64) {
                    await supabase
                        .from('generations')
                        .update({ status: 'error', error_message: 'Video completed but no data', updated_at: new Date().toISOString() })
                        .eq('id', gen.id);
                }
            }
        } catch (e) {
            console.error(`Error polling video ${gen.id}:`, e);
        }
    }

    return NextResponse.json({
        polled: generatingVideos.length,
        updated: updatedIds.length,
        updatedIds,
    });
}
