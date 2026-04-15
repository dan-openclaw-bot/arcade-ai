import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI(apiKey?: string): OpenAI {
    if (apiKey) return new OpenAI({ apiKey });
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    }
    return _openai;
}

/**
 * Check if a model ID is an OpenAI image model
 */
export function isOpenAIImageModel(modelId: string): boolean {
    return modelId.startsWith('gpt-image-');
}

/**
 * Generate a single image using GPT Image models
 */
export async function generateGPTImage(
    prompt: string,
    aspectRatio: string = '1:1',
    referenceImageUrls: string[] = [],
    apiKey?: string,
): Promise<{ base64: string; mimeType: string } | null> {
    const sizeMap: Record<string, string> = {
        '1:1': '1024x1024',
        '9:16': '1024x1536',
        '16:9': '1536x1024',
    };

    const openai = getOpenAI(apiKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
        model: 'gpt-image-1.5',
        prompt,
        n: 1,
        size: sizeMap[aspectRatio] || '1024x1024',
        quality: 'medium',
    };

    const response = await openai.images.generate(params);

    const imageData = response.data?.[0];
    if (!imageData) return null;

    if (imageData.b64_json) {
        return { base64: imageData.b64_json, mimeType: 'image/png' };
    }

    if (imageData.url) {
        const imgRes = await fetch(imageData.url);
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get('content-type') || 'image/png';
        return { base64: buffer.toString('base64'), mimeType: contentType };
    }

    return null;
}

/**
 * Generate a video using Sora 2 models
 * Returns an operation/job ID for polling
 */
export async function generateSoraVideo(
    prompt: string,
    model: string,
    aspectRatio: string = '9:16',
    durationSeconds: number = 8,
    referenceImageBase64?: string,
    apiKey?: string,
): Promise<{ videoId: string }> {
    // Sora: always use 720p to keep costs at $0.30/s (1080p = $0.50/s)
    // VideoSize: "720x1280" (portrait) | "1280x720" (landscape)
    let size: '720x1280' | '1280x720' | '1024x1792' | '1792x1024';
    if (aspectRatio === '16:9') {
        size = '1280x720';
    } else {
        // 9:16 or 1:1 — fall back to portrait (Sora has no square option)
        size = '720x1280';
    }

    // Sora API DEVELOPER tier only accepts 4, 8 or 12 seconds
    // (25s is web-only for ChatGPT Pro — not available via API)
    const soraSeconds = durationSeconds <= 4 ? 4 : durationSeconds <= 8 ? 8 : 12;
    const seconds = soraSeconds;

    // Build request params
    const openai = getOpenAI(apiKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
        model,
        prompt,
        size,
        seconds,
    };

    // Add reference image if provided — must be a Buffer passed as Uploadable and EXACTLY match target size
    if (referenceImageBase64) {
        const [wStr, hStr] = size.split('x');
        const targetWidth = parseInt(wStr, 10);
        const targetHeight = parseInt(hStr, 10);

        const originalBuffer = Buffer.from(referenceImageBase64, 'base64');
        const sharp = (await import('sharp')).default;

        // Resize and crop to exactly match target video dimensions
        const resizedBuffer = await sharp(originalBuffer)
            .resize(targetWidth, targetHeight, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 95 })
            .toBuffer();

        const { toFile } = await import('openai');
        params.input_reference = await toFile(resizedBuffer, 'reference.jpg', { type: 'image/jpeg' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai as any).videos.create(params);

    return { videoId: response.id };
}



/**
 * Poll Sora video generation status
 */
export async function pollSoraVideo(
    videoId: string,
    apiKey?: string,
): Promise<{ done: boolean; videoBase64?: string; status?: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const video = await (getOpenAI(apiKey) as any).videos.retrieve(videoId);

    if (video.status === 'completed') {
        // Download the video
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await (getOpenAI(apiKey) as any).videos.downloadContent(videoId);
            if (!response.ok) {
                console.error(`Download failed: ${response.status} ${response.statusText}`);
                return { done: true, status: 'error' };
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const base64 = buffer.toString('base64');
            return { done: true, videoBase64: base64, status: 'completed' };
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
