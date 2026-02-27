const { GoogleGenAI } = require('@google/genai');
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    console.log("Testing 2 images with imagen-4.0-fast-generate-001...");
    const response = await genai.models.generateImages({
      model: 'imagen-4.0-fast-generate-001',
      prompt: 'a futuristic city',
      config: {
        numberOfImages: 2,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      },
    });
    console.log('Success:', response.generatedImages?.length);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
