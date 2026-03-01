const fs = require('fs');
const env = fs.readFileSync('../.env', 'utf-8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].replace(/"/g, '').trim() : null;

async function run() {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    if (data.models) {
        const relevant = data.models.filter(m =>
            m.name.includes('gemini') && (
                m.name.includes('flash') ||
                m.name.includes('pro') ||
                m.name.includes('image')
            )
        );
        console.log('--- GEMINI MODELS (flash/pro/image) ---');
        relevant.forEach(m => console.log(m.name, '|', (m.supportedGenerationMethods || []).join(', ')));
    }
}
run();
