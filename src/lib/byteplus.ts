const BYTEPLUS_API_KEY = process.env.BYTEPLUS_API_KEY || '';
const BYTEPLUS_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3';

// Seedream model ID on BytePlus ModelArk
const SEEDREAM_MODEL_ID = 'seedream-5-0-260128';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Generate a single image using BytePlus Seedream.
 * Matches the official BytePlus ModelArk API format exactly.
 */
export async function generateSeedreamImage(
    prompt: string,
    aspectRatio: string = '1:1',
    referenceImageUrls: string[] = [],
    apiKey?: string,
): Promise<{ base64: string; mimeType: string } | null> {
    const key = apiKey || BYTEPLUS_API_KEY;
    if (!key) throw new Error('BytePlus API key not configured');

    // Seedream size param accepts WIDTHxHEIGHT, 2k, or 3k
    const sizeMap: Record<string, string> = {
        '1:1': '2k',
        '9:16': '1440x2560',
        '16:9': '2560x1440',
    };

    // Build request body matching the official BytePlus API format
    const body: Record<string, unknown> = {
        model: SEEDREAM_MODEL_ID,
        prompt,
        size: sizeMap[aspectRatio] || '2k',
        response_format: 'url',
        sequential_image_generation: 'disabled',
        stream: false,
        watermark: false,
    };

    // Add reference image if provided
    if (referenceImageUrls.length > 0) {
        body.image = referenceImageUrls[0];
    }

    const res = await fetch(`${BYTEPLUS_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
        const errMsg = data?.error?.message || `BytePlus API error: HTTP ${res.status}`;
        throw new Error(errMsg);
    }

    // Response: { data: [{ url: "https://...", size: "2848x1600" }] }
    const imageEntry = data?.data?.[0];
    if (!imageEntry?.url) {
        throw new Error('BytePlus returned no image data');
    }

    // Download the image URL and convert to base64
    const imgRes = await fetch(imageEntry.url);
    if (!imgRes.ok) {
        throw new Error(`Failed to download BytePlus image: HTTP ${imgRes.status}`);
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

    return { base64: buffer.toString('base64'), mimeType: contentType };
}

/**
 * Check if a model ID is a BytePlus Seedream model
 */
export function isBytePlusModel(modelId: string): boolean {
    return modelId.startsWith('seedream-');
}
