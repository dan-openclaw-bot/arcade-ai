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
    // Map aspect ratio to Sora supported size strings
    // sora-2: 720x1280 / 1280x720
    // sora-2-pro: 720x1280 / 1024x1792 / 1280x720 / 1792x1024 / 480x480 / 720x720 / 1080x1080
    let size: string;
    if (aspectRatio === '16:9') {
        size = '1280x720';
    } else if (aspectRatio === '9:16') {
        size = '720x1280';
    } else {
        // 1:1 — sora-2-pro supports 720x720, sora-2 use smallest valid square
        size = model === 'sora-2-pro' ? '720x720' : '480x480';
    }

    // Clamp duration to model limits
    const maxSeconds = model === 'sora-2-pro' ? 25 : 20;
    const seconds = Math.min(durationSeconds, maxSeconds);

    // Build request params — prompt is top-level per OpenAI API spec
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
        model,
        prompt,
        size,
        seconds,
    };

    // Add reference image if provided
    if (referenceImageBase64) {
        params.image = {
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
