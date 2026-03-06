const { GoogleGenAI } = require('@google/genai');
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
    try {
        console.log('Sending request to gemini-3.1-flash-image-preview...');
        const responses = await genai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: 'Tu peux remplacer la prise par une veilleuse',
            config: { responseModalities: ['Text', 'Image'] }
        });
        console.log('Success!');
    } catch (e) {
        console.error('Error:', e);
    }
})();
