import { GoogleGenAI } from '@google/genai';

const defaultApiKey = process.env.GEMINI_API_KEY!;

// Vertex AI config
const VERTEX_API_KEY = process.env.VERTEX_API_KEY || '';
const VERTEX_REGIONS = (process.env.VERTEX_REGIONS || 'us-central1,europe-west1,europe-west4').split(',');
// Gemini image models only work on the global endpoint
const VERTEX_GLOBAL = 'https://aiplatform.googleapis.com/v1/publishers/google/models';

// Direct API client (for users with their own key)
export const genai = new GoogleGenAI({ apiKey: defaultApiKey });

function getGenAI(apiKey?: string): GoogleGenAI {
    if (apiKey) return new GoogleGenAI({ apiKey });
    return genai;
}

function shouldUseVertex(userApiKey?: string): boolean {
    return !userApiKey && !!VERTEX_API_KEY;
}

/**
 * Call Vertex AI — Gemini models use global endpoint, Imagen uses regional with fallback
 */
async function vertexFetch(model: string, body: Record<string, unknown>, endpoint: string = 'generateContent'): Promise<Record<string, unknown>> {
    if (model.startsWith('gemini-')) {
        // Gemini image models → global endpoint only
        const url = `${VERTEX_GLOBAL}/${model}:${endpoint}?key=${VERTEX_API_KEY}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
            const errMsg = (data as { error?: { message?: string } }).error?.message || `HTTP ${res.status}`;
            throw new Error(errMsg);
        }
        return data as Record<string, unknown>;
    }

    // Imagen models → regional endpoints with fallback
    let lastError: unknown;
    for (const region of VERTEX_REGIONS) {
        const url = `https://${region}-aiplatform.googleapis.com/v1/publishers/google/models/${model}:${endpoint}?key=${VERTEX_API_KEY}`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                const errMsg = (data as { error?: { message?: string } }).error?.message || `HTTP ${res.status}`;
                const lower = errMsg.toLowerCase();
                if (lower.includes('quota') || lower.includes('resource') || lower.includes('capacity') || res.status === 429 || res.status === 503) {
                    console.warn(`Vertex AI region ${region} overloaded (${res.status}), trying next...`);
                    lastError = new Error(errMsg);
                    continue;
                }
                throw new Error(errMsg);
            }
            return data as Record<string, unknown>;
        } catch (err: unknown) {
            lastError = err;
            const msg = String(err).toLowerCase();
            if (msg.includes('quota') || msg.includes('resource') || msg.includes('capacity') || msg.includes('429') || msg.includes('503')) {
                console.warn(`Vertex AI region ${region} error, trying next...`);
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}

/**
 * Generate a SINGLE image — call in parallel for multiple images
 */
export async function generateSingleImage(
    prompt: string,
    model: string,
    aspectRatio: string = '1:1',
    referenceImageUrls: string[] = [],
    qualitySuffix?: string,
    negativePrompt?: string,
    apiKey?: string,
): Promise<{ base64: string; mimeType: string } | null> {
    const result = await generateImages(prompt, model, 1, aspectRatio, referenceImageUrls, qualitySuffix, negativePrompt, apiKey);
    return result[0] || null;
}

/**
 * Generate images using Imagen or Gemini models via Vertex AI (admin) or direct API (users)
 */
export async function generateImages(
    prompt: string,
    model: string,
    count: number = 1,
    aspectRatio: string = '1:1',
    referenceImageUrls: string[] = [],
    qualitySuffix?: string,
    negativePrompt?: string,
    apiKey?: string,
): Promise<{ base64: string; mimeType: string }[]> {
    const aspectRatioMap: Record<string, string> = {
        '1:1': '1:1',
        '9:16': '9:16',
        '16:9': '16:9',
    };
    const mappedRatio = aspectRatioMap[aspectRatio] || '1:1';
    const useVertex = shouldUseVertex(apiKey);

    if (model.startsWith('gemini-')) {
        let enhancedPrompt = prompt;
        if (aspectRatio === '1:1') enhancedPrompt = `[Square 1:1 format] ${enhancedPrompt}`;
        else if (aspectRatio === '9:16') enhancedPrompt = `[Portrait 9:16 format] ${enhancedPrompt}`;
        else if (aspectRatio === '16:9') enhancedPrompt = `[Landscape 16:9 format] ${enhancedPrompt}`;
        if (qualitySuffix) enhancedPrompt += `, ${qualitySuffix}`;
        if (negativePrompt) enhancedPrompt += ` (Do NOT include: ${negativePrompt})`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let contents: any[] = [];
        if (referenceImageUrls && referenceImageUrls.length > 0) {
            const imageParts = await Promise.all(
                referenceImageUrls.map(async (url) => {
                    const imgResponse = await fetch(url);
                    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
                    const imgBase64 = imgBuffer.toString('base64');
                    const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
                    return { inlineData: { data: imgBase64, mimeType: contentType } };
                })
            );
            enhancedPrompt += '\n\nUse the provided reference image(s) as a style guide for the generated image.';
            contents = [...imageParts, { text: enhancedPrompt }];
        } else {
            contents = [{ text: enhancedPrompt }];
        }

        const actualCount = Math.min(count, 4);

        if (useVertex) {
            const body = {
                contents: [{ role: 'user', parts: contents }],
                generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
            };

            const responses = await Promise.all(
                Array.from({ length: actualCount }, () => vertexFetch(model, body))
            );

            const results: { base64: string; mimeType: string }[] = [];
            for (const data of responses) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const candidates = (data as any).candidates || [];
                for (const candidate of candidates) {
                    for (const part of candidate.content?.parts || []) {
                        if (part.inlineData?.data && part.inlineData?.mimeType) {
                            results.push({
                                base64: part.inlineData.data,
                                mimeType: part.inlineData.mimeType,
                            });
                        }
                    }
                }
            }
            return results;
        }

        // Direct API for users with their own key
        const ai = getGenAI(apiKey);
        const responses = await Promise.all(
            Array.from({ length: actualCount }, () =>
                ai.models.generateContent({
                    model,
                    contents,
                    config: { responseModalities: ['Text', 'Image'] },
                })
            )
        );

        const results: { base64: string; mimeType: string }[] = [];
        for (const response of responses) {
            if (response.candidates) {
                for (const candidate of response.candidates) {
                    if (candidate.content?.parts) {
                        for (const part of candidate.content.parts) {
                            if (part.inlineData?.data && part.inlineData?.mimeType) {
                                results.push({
                                    base64: part.inlineData.data,
                                    mimeType: part.inlineData.mimeType,
                                });
                            }
                        }
                    }
                }
            }
        }
        return results;
    }

    // Imagen models
    const config: Record<string, unknown> = {
        numberOfImages: 1,
        aspectRatio: mappedRatio,
        outputMimeType: 'image/jpeg',
    };

    const suffix = qualitySuffix ? `, ${qualitySuffix}` : '';
    const negInstructions = negativePrompt ? ` (Do NOT include: ${negativePrompt})` : '';
    const finalPrompt = `${prompt}${suffix}${negInstructions}`;

    if (referenceImageUrls && referenceImageUrls.length > 0) {
        try {
            const referenceImagesConfig = await Promise.all(
                referenceImageUrls.map(async (url) => {
                    const imgResponse = await fetch(url);
                    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
                    return {
                        referenceType: 2,
                        referenceImage: { imageBytes: imgBuffer.toString('base64') },
                    };
                })
            );
            config.referenceImages = referenceImagesConfig;
        } catch (e) {
            console.error('Failed to download reference images for Imagen:', e);
        }
    }

    const actualCount = Math.min(count, 4);

    if (useVertex) {
        // Vertex AI REST for Imagen — regional with fallback
        const body = {
            instances: [{ prompt: finalPrompt }],
            parameters: config,
        };

        const responses = await Promise.all(
            Array.from({ length: actualCount }, () => vertexFetch(model, body, 'predict'))
        );

        const results: { base64: string; mimeType: string }[] = [];
        for (const data of responses) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const predictions = (data as any).predictions || [];
            for (const pred of predictions) {
                if (pred.bytesBase64Encoded) {
                    results.push({ base64: pred.bytesBase64Encoded, mimeType: 'image/jpeg' });
                }
            }
        }
        if (results.length === 0) throw new Error('No images generated');
        return results;
    }

    // Direct API for users
    const responses = await Promise.all(
        Array.from({ length: actualCount }, () =>
            getGenAI(apiKey).models.generateImages({ model, prompt: finalPrompt, config })
        )
    );

    const results: { base64: string; mimeType: string }[] = [];
    for (const response of responses) {
        if (response.generatedImages && response.generatedImages.length > 0) {
            const img = response.generatedImages[0];
            const bytes = img.image?.imageBytes;
            const base64 =
                typeof bytes === 'string'
                    ? bytes
                    : bytes
                        ? Buffer.from(bytes as Buffer).toString('base64')
                        : '';
            if (base64) {
                results.push({ base64, mimeType: 'image/jpeg' });
            }
        }
    }

    if (results.length === 0) throw new Error('No images generated');
    return results;
}

/**
 * Generate a video using Veo models
 */
export async function generateVideo(
    prompt: string,
    model: string,
    aspectRatio: string = '9:16',
    durationSeconds: number = 8,
    referenceImageBase64?: string,
    apiKey?: string,
): Promise<{ operationName: string }> {
    const config: Record<string, unknown> = {
        aspectRatio,
        durationSeconds,
    };

    if (referenceImageBase64) {
        config.referenceImages = [
            {
                referenceType: 'REFERENCE_TYPE_STYLE',
                referenceImage: { imageBytes: referenceImageBase64 },
            },
        ];
    }

    if (shouldUseVertex(apiKey)) {
        const body = {
            instances: [{ prompt }],
            parameters: config,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await vertexFetch(model, body, 'predict') as any;
        const opName = data.name || '';
        return { operationName: opName };
    }

    const operation = await getGenAI(apiKey).models.generateVideos({ model, prompt, config });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opName = (operation as any).name || '';
    return { operationName: opName };
}

/**
 * Poll video generation operation
 */
export async function pollVideoOperation(
    operationName: string,
    apiKey?: string,
): Promise<{ done: boolean; videoBase64?: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const op = await (getGenAI(apiKey).operations as any).getVideosOperation({
        operation: { name: operationName },
    });

    if (!op.done) return { done: false };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const samples = (op.response as any)?.generatedSamples;
    const videoBytes = samples?.[0]?.video?.videoBytes;
    if (videoBytes) {
        const base64 =
            typeof videoBytes === 'string'
                ? videoBytes
                : Buffer.from(videoBytes as Buffer).toString('base64');
        return { done: true, videoBase64: base64 };
    }

    return { done: true };
}
