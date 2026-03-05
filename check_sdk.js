const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const videoId = "video_69a990a1c9708191bdea7b282643b2480c054dd420a4d53e";

async function check() {
    try {
        console.log("Downloading video...", videoId);
        // downloadContent returns a node-fetch Response proxy wrapping the binary stream
        const response = await openai.videos.downloadContent(videoId);

        console.log("Response object keys:", Object.keys(response));
        console.log("Methods:", ['ok', 'status', 'headers', 'arrayBuffer', 'blob', 'text'].filter(m => typeof response[m] === 'function' || response[m] !== undefined));

        if (typeof response.arrayBuffer === 'function') {
            const buf = await response.arrayBuffer();
            console.log("Got buffer length:", buf.byteLength);
        } else if (response.body) {
            console.log("reading stream body");
            // Node readable stream
            const chunks = [];
            for await (const chunk of response.body) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            console.log("Stream buffer length:", buffer.length);
        }
    } catch (e) {
        console.error("SDK Error:", e);
    }
}
check();
