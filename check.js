const fs = require('fs');
const env = fs.readFileSync('../.env', 'utf-8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].replace(/"/g, '').trim() : null;

async function run() {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();

        if (data.models) {
            const imgModels = data.models.filter(m =>
                m.name.includes('imagen') ||
                (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateImages'))
            );
            console.log('--- AVAILABLE IMAGE MODELS ---');
            imgModels.forEach(m => console.log(m.name, 'Methods:', m.supportedGenerationMethods));
        } else {
            console.log('Error:', data);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
