import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY!;

export const genai = new GoogleGenAI({ apiKey });

/**
 * Generate images using Imagen or Gemini models
 * Returns array of base64 image data
 */
export async function generateImages(
    prompt: string,
    model: string,
    count: number = 1,
    aspectRatio: string = '1:1'
): Promise<{ base64: string; mimeType: string }[]> {
    const aspectRatioMap: Record<string, string> = {
        '1:1': '1:1',
        '9:16': '9:16',
        '16:9': '16:9',
    };
    const mappedRatio = aspectRatioMap[aspectRatio] || '1:1';

    // Gemini 2.0 Flash uses generateContent with responseModalities
    if (model.startsWith('gemini-')) {
        const response = await genai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseModalities: ['Text', 'Image'],
            },
        });

        const results: { base64: string; mimeType: string }[] = [];
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
        return results;
    }

    // Imagen models — use generateImages
    const response = await genai.models.generateImages({
        model,
        prompt,
        config: {
            numberOfImages: Math.min(count, 4),
            aspectRatio: mappedRatio,
            outputMimeType: 'image/jpeg',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error('No images generated');
    }

    return response.generatedImages.map((img) => {
        const bytes = img.image?.imageBytes;
        const base64 =
            typeof bytes === 'string'
                ? bytes
                : bytes
                    ? Buffer.from(bytes as Buffer).toString('base64')
                    : '';
        return { base64, mimeType: 'image/jpeg' };
    });
}

/**
 * Generate a video using Veo models
 * Returns the operation object for polling
 */
export async function generateVideo(
    prompt: string,
    model: string,
    aspectRatio: string = '9:16',
    durationSeconds: number = 8,
    referenceImageBase64?: string
): Promise<{ operationName: string }> {
    const config: Record<string, unknown> = {
        aspectRatio,
        durationSeconds,
    };

    if (referenceImageBase64) {
        config.referenceImages = [
            {
                referenceType: 'REFERENCE_TYPE_STYLE',
                referenceImage: {
                    imageBytes: referenceImageBase64,
                },
            },
        ];
    }

    const operation = await genai.models.generateVideos({
        model,
        prompt,
        config,
    });

    // operation.name may be on the raw operation object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opName = (operation as any).name || '';
    return { operationName: opName };
}

/**
 * Poll video generation operation
 */
export async function pollVideoOperation(
    operationName: string
): Promise<{ done: boolean; videoBase64?: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const op = await (genai.operations as any).getVideosOperation({
        operation: { name: operationName },
    });

    if (!op.done) {
        return { done: false };
    }

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
