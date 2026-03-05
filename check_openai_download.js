const videoId = "video_69a990a1c9708191bdea7b282643b2480c054dd420a4d53e";
const apiKey = process.env.OPENAI_API_KEY;

async function check() {
    try {
        console.log("Downloading video...");
        const res = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await res.json();
        const urlToDownload = data.url || data.media_url || data.video_url;
        console.log("OpenAI Video URL:", urlToDownload);
        console.log("Full data:", Object.keys(data));

        if (data.file_id) {
            console.log("Found file_id:", data.file_id);
            const fileRes = await fetch(`https://api.openai.com/v1/files/${data.file_id}/content`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            console.log("File content status:", fileRes.status, fileRes.statusText);
            const buffer = await fileRes.arrayBuffer();
            console.log("Downloaded buffer size:", buffer.byteLength);
        }

    } catch (e) {
        console.error(e);
    }
}
check();
