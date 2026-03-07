import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('No GEMINI_API_KEY found');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testMultipleImages() {
    const model = 'gemini-3.1-flash-image-preview'; // Nano Banana 2
    const prompt = 'A beautiful portrait combining the features of both people provided in the images.';

    // Small 1x1 base64 string for testing
    const imgBase64_1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // 1x1 transp
    const imgBase64_2 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='; // 1x1 black

    console.log('Testing generateContent with 2 input images...');
    try {
        const res = await ai.models.generateContent({
            model,
            contents: [
                { inlineData: { data: imgBase64_1, mimeType: 'image/png' } },
                { inlineData: { data: imgBase64_2, mimeType: 'image/png' } },
                { text: prompt }
            ],
            config: {
                responseModalities: ['Text', 'Image'],
            },
        });
        console.log('generateContent Success!');
        console.log('Got response ID:', res.responseId);
    } catch (e) {
        console.error('generateContent Error:', e.message);
    }

    // Imagen 4 test
    console.log('\nTesting generateImages (Imagen 4) with 2 reference images...');
    try {
        const res2 = await ai.models.generateImages({
            model: 'imagen-4.0-ultra-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
                referenceImages: [
                    { referenceType: 2, referenceImage: { imageBytes: imgBase64_1 } },
                    { referenceType: 2, referenceImage: { imageBytes: imgBase64_2 } },
                ]
            },
        });
        console.log('generateImages Success!');
        console.log('Images generated:', res2.generatedImages.length);
    } catch (e) {
        console.error('generateImages Error:', e.message);
    }
}

testMultipleImages();
