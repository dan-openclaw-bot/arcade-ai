const BYTEPLUS_API_KEY = process.env.BYTEPLUS_API_KEY || '';
const BYTEPLUS_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3';

// Seedream model ID on BytePlus ModelArk
const SEEDREAM_MODEL_ID = 'seedream-5-0-260128';

const POLL_INITIAL_DELAY_MS = 3000;
const POLL_MAX_DELAY_MS = 10000;
const POLL_MAX_ATTEMPTS = 60; // ~5 minutes max

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface BytePlusImageResponse {
    created?: number;
    data?: { url?: string; b64_json?: string; revised_prompt?: string }[];
    // Async task response fields
    id?: string;
    status?: string;
    progress?: number;
    results?: string[];
    error?: { message?: string; code?: string };
}

async function bytePlusFetch(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: Record<string, unknown>,
    apiKey?: string,
): Promise<BytePlusImageResponse> {
    const key = apiKey || BYTEPLUS_API_KEY;
    if (!key) throw new Error('BytePlus API key not configured');

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
    };

    const res = await fetch(`${BYTEPLUS_BASE_URL}${endpoint}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json();

    if (!res.ok) {
        const errMsg = data?.error?.message || `BytePlus API error: HTTP ${res.status}`;
        throw new Error(errMsg);
    }

    return data as BytePlusImageResponse;
}

async function pollTask(taskId: string, apiKey?: string): Promise<BytePlusImageResponse> {
    let delay = POLL_INITIAL_DELAY_MS;

    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
        await sleep(delay);

        const result = await bytePlusFetch(`/images/generations/${taskId}`, 'GET', undefined, apiKey);

        if (result.status === 'completed' || result.status === 'succeeded') {
            return result;
        }

        if (result.status === 'failed' || result.status === 'cancelled') {
            throw new Error(`BytePlus generation ${result.status}: ${result.error?.message || 'unknown error'}`);
        }

        // Increase delay up to max
        delay = Math.min(delay * 1.5, POLL_MAX_DELAY_MS);
    }

    throw new Error('BytePlus generation timed out after polling');
}

/**
 * Generate a single image using BytePlus Seedream
 */
export async function generateSeedreamImage(
    prompt: string,
    aspectRatio: string = '1:1',
    referenceImageUrls: string[] = [],
    apiKey?: string,
): Promise<{ base64: string; mimeType: string } | null> {
    const sizeMap: Record<string, string> = {
        '1:1': '1:1',
        '9:16': '9:16',
        '16:9': '16:9',
    };

    const body: Record<string, unknown> = {
        model: SEEDREAM_MODEL_ID,
        prompt,
        size: sizeMap[aspectRatio] || '1:1',
        response_format: 'b64_json',
        n: 1,
    };

    if (referenceImageUrls.length > 0) {
        body.image = referenceImageUrls[0];
    }

    const response = await bytePlusFetch('/images/generations', 'POST', body, apiKey);

    // Synchronous response — image data directly in response
    if (response.data && response.data.length > 0) {
        const img = response.data[0];

        if (img.b64_json) {
            return { base64: img.b64_json, mimeType: 'image/png' };
        }

        if (img.url) {
            const imgRes = await fetch(img.url);
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            const contentType = imgRes.headers.get('content-type') || 'image/png';
            return { base64: buffer.toString('base64'), mimeType: contentType };
        }
    }

    // Async task response — need to poll
    if (response.id && response.status) {
        const completed = await pollTask(response.id, apiKey);

        // Check for data array in completed response
        if (completed.data && completed.data.length > 0) {
            const img = completed.data[0];
            if (img.b64_json) {
                return { base64: img.b64_json, mimeType: 'image/png' };
            }
            if (img.url) {
                const imgRes = await fetch(img.url);
                const buffer = Buffer.from(await imgRes.arrayBuffer());
                const contentType = imgRes.headers.get('content-type') || 'image/png';
                return { base64: buffer.toString('base64'), mimeType: contentType };
            }
        }

        // Check for results array (URL strings)
        if (completed.results && completed.results.length > 0) {
            const imgUrl = completed.results[0];
            const imgRes = await fetch(imgUrl);
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            const contentType = imgRes.headers.get('content-type') || 'image/png';
            return { base64: buffer.toString('base64'), mimeType: contentType };
        }
    }

    return null;
}

/**
 * Check if a model ID is a BytePlus Seedream model
 */
export function isBytePlusModel(modelId: string): boolean {
    return modelId.startsWith('seedream-');
}
