const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function recover() {
    console.log("Checking for stuck videos...");
    const { data: generatingVideos } = await supabase.from('generations').select('*').eq('type', 'video').eq('status', 'generating');

    if (!generatingVideos || generatingVideos.length === 0) {
        console.log("No videos are stuck in generating state.");
        return;
    }

    console.log(`Found ${generatingVideos.length} stuck videos.`);

    for (const gen of generatingVideos) {
        if (gen.metadata?.provider === 'openai' && gen.metadata?.sora_video_id) {
            console.log(`Recovering Sora video: ${gen.metadata.sora_video_id} for generation ID: ${gen.id}`);
            try {
                // Get video status
                const videoData = await openai.videos.retrieve(gen.metadata.sora_video_id);
                console.log(`Status on OpenAI: ${videoData.status}`);

                if (videoData.status === 'completed') {
                    console.log("Downloading content...");
                    const response = await openai.videos.downloadContent(gen.metadata.sora_video_id);
                    if (!response.ok) throw new Error("Failed to download from OpenAI");

                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    console.log(`Downloaded ${buffer.length} bytes.`);

                    const fileName = `video_${gen.id}_${Date.now()}.mp4`;

                    console.log("Uploading to Supabase...");
                    const { error: uploadError } = await supabase.storage
                        .from('generations')
                        .upload(fileName, buffer, { contentType: 'video/mp4' });

                    if (uploadError) {
                        console.error('Supabase upload error:', uploadError);
                        await supabase
                            .from('generations')
                            .update({ status: 'error', error_message: `Recovery upload failed: ${uploadError.message}`, updated_at: new Date().toISOString() })
                            .eq('id', gen.id);
                    } else {
                        const { data: urlData } = supabase.storage.from('generations').getPublicUrl(fileName);
                        console.log("File uploaded successfully. Public URL:", urlData.publicUrl);

                        await supabase
                            .from('generations')
                            .update({
                                status: 'done',
                                output_url: urlData.publicUrl,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', gen.id);
                        console.log(`Successfully recovered generation ${gen.id}.`);
                    }
                }
            } catch (e) {
                console.error(`Error recovering video ${gen.id}:`, e);
            }
        }
    }
}
recover();
