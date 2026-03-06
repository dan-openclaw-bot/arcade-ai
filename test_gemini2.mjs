import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
    const model = 'gemini-3-pro-image-preview';
    const prompt = 'A beautiful sunset over the ocean';

    // Create a base64 string from an HTML page (mimicking a Supabase 403 error)
    const htmlStr = '<html><body>Forbidden</body></html>';
    const imgBase64 = Buffer.from(htmlStr).toString('base64');
    const contentType = 'image/jpeg';

    console.log('Testing generateContent with HTML base64 passed as JPEG...');
    try {
        const res = await ai.models.generateContent({
            model,
            contents: [
                { inlineData: { data: imgBase64, mimeType: contentType } },
                { text: `[Landscape 16:9 format] ${prompt}` }
            ],
            config: {
                responseModalities: ['Text', 'Image'],
            },
        });
        console.log('generateContent Success!');
    } catch (e) {
        console.error('generateContent Error:', e.message);
    }
}

test();
