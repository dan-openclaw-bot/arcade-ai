import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY);
        const data = await response.json();
        if (data.models) {
            const imgModels = data.models.filter((m: any) =>
                m.name.includes('imagen') ||
                (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateImages'))
            );
            console.log('Available models for images:', imgModels.map((m: any) => m.name));
        } else {
            console.log('No models returned', data);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
