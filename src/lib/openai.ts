import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    }
    return _openai;
}

/**
 * Generate a video using Sora 2 models
 * Returns an operation/job ID for polling
 */
export async function generateSoraVideo(
    prompt: string,
    model: string,
    aspectRatio: string = '9:16',
    durationSeconds: number = 10,
    referenceImageBase64?: string,
): Promise<{ videoId: string }> {
    // Map aspect ratio to Sora resolution (using LOWEST available)
    // sora-2: 720x1280 / 1280x720 only (no 1:1 support, use smallest square)
    // sora-2-pro: 720x1280 / 1024x1792 / 1280x720 / 1792x1024 / 480x480 / 720x720 / 1080x1080
    let width: number;
    let height: number;
    if (aspectRatio === '16:9') {
        width = 1280; height = 720; // lowest landscape for both models
    } else if (aspectRatio === '9:16') {
        width = 720; height = 1280; // lowest portrait for both models
    } else {
        // 1:1 — use 480x480 (lowest square, sora-2-pro supports it)
        width = 480; height = 480;
    }

    // Build request params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
        model,
        input: {
            prompt,
        },
        duration: durationSeconds > 10 ? 10 : (durationSeconds < 5 ? 5 : durationSeconds),
        width,
        height,
    };

    // Add reference image if provided
    if (referenceImageBase64) {
        params.input.image = {
            type: 'base64',
            data: referenceImageBase64,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (getOpenAI() as any).videos.create(params);

    return { videoId: response.id };
}

/**
 * Poll Sora video generation status
 */
export async function pollSoraVideo(
    videoId: string,
): Promise<{ done: boolean; videoBase64?: string; status?: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const video = await (getOpenAI() as any).videos.retrieve(videoId);

    if (video.status === 'completed') {
        // Download the video
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const downloadResponse = await (getOpenAI() as any).videos.download(videoId);
            // The response contains the video data
            if (downloadResponse.url) {
                const videoResponse = await fetch(downloadResponse.url);
                const buffer = Buffer.from(await videoResponse.arrayBuffer());
                const base64 = buffer.toString('base64');
                return { done: true, videoBase64: base64, status: 'completed' };
            }
        } catch (e) {
            console.error('Error downloading Sora video:', e);
        }
        return { done: true, status: 'completed' };
    }

    if (video.status === 'failed') {
        throw new Error(`Sora video generation failed: ${video.error?.message || 'Unknown error'}`);
    }

    return { done: false, status: video.status };
}
