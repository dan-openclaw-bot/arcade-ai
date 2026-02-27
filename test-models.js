const { GoogleGenAI } = require('@google/genai');

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function checkModels() {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        if (data.models) {
            const imgModels = data.models.filter(m =>
                m.name.includes('imagen') ||
                (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateImages'))
            );
            console.log('--- AVAILABLE IMAGE MODELS ---');
            imgModels.forEach(m => console.log(m.name));
        } else {
            console.log('Error fetching models:', data);
        }
    } catch (e) {
        console.error(e);
    }
}
checkModels();
