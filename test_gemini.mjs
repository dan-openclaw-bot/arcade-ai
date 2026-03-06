import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
    const model = 'gemini-3-pro-image-preview';
    const prompt = 'A beautiful sunset over the ocean';

    console.log('Testing generateContent with 16:9...');
    try {
        const res = await ai.models.generateContent({
            model,
            contents: `[Landscape 16:9 format] ${prompt}`,
            config: {
                responseModalities: ['Text', 'Image'],
            },
        });
        console.log('generateContent Success!');
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('generateContent Error:', e.message);
    }
}

test();
