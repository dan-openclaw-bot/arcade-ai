require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { pollSoraVideo } = require('./dist/poll_test.js'); // We'll compile the TS function for a quick test

async function run() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: generatingVideos } = await supabase.from('generations').select('*').eq('type', 'video').eq('status', 'generating');

    console.log(`Found ${generatingVideos.length} generating videos`);
    for (const gen of generatingVideos) {
        if (gen.metadata?.provider === 'openai' && gen.metadata?.sora_video_id) {
            console.log(`Polling Sora video: ${gen.metadata.sora_video_id}`);
            try {
                const result = await pollSoraVideo(gen.metadata.sora_video_id);
                console.log("Poll result:", Object.keys(result), "Done:", result.done);
                if (result.videoBase64) {
                    console.log("Got base64, length:", result.videoBase64.length);
                    // Test Supabase upload
                    const buffer = Buffer.from(result.videoBase64, 'base64');
                    const fileName = `test_${gen.id}.mp4`;
                    const { error } = await supabase.storage.from('generations').upload(fileName, buffer, { contentType: 'video/mp4' });
                    console.log("Upload error?", error);
                }
            } catch (e) {
                console.error("Error polling:", e);
            }
        }
    }
}
// run();
