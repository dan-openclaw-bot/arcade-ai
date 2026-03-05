const videoId = "video_69a990a1c9708191bdea7b282643b2480c054dd420a4d53e";
const apiKey = process.env.OPENAI_API_KEY;

async function check() {
    try {
        const res = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await res.json();
        console.log("Status:", data.status);
        if (data.error) console.error(data.error);
    } catch (e) {
        console.error(e);
    }
}
check();
