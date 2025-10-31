import { spawn } from 'child_process';

const MAX_DOWNLOAD_TIME = 55000;
const MAX_FILE_SIZE = 1000 * 1024 * 1024;

export async function POST(request) {
    try {
        const { url, format_id } = await request.json();

        if (!url || !format_id) {
            return new Response(JSON.stringify({ error: 'URL and format_id required' }), { status: 400 });
        }

        if (!isValidUrl(url)) {
            return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400 });
        }

        console.log(`Starting download: ${format_id} from ${url}`);

        const readable = await streamDownload(url, format_id);

        return new Response(readable, {
            status: 200,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="video.mp4"',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('Download error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Download failed' }),
            { status: 500 }
        );
    }
}

function isValidUrl(url) {
    try {
        new URL(url);
        const validPlatforms = ['youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com', 'facebook.com', 'pinterest.com'];
        return validPlatforms.some(p => url.includes(p));
    } catch {
        return false;
    }
}

async function streamDownload(url, format_id) {
    return new ReadableStream({
        async start(controller) {
            let process = null;
            let bytesReceived = 0;

            try {
                process = spawn('yt-dlp', [
                    '-f', format_id,
                    '-o', '-',
                    '--quiet',
                    '--no-warnings',
                    '--socket-timeout', '30',
                    url,
                ], {
                    stdio: ['ignore', 'pipe', 'pipe'],
                });

                const timeout = setTimeout(() => {
                    console.warn('Download timeout');
                    if (process) process.kill();
                    controller.error(new Error('Download timeout'));
                }, MAX_DOWNLOAD_TIME);

                process.stdout.on('data', (chunk) => {
                    bytesReceived += chunk.length;

                    if (bytesReceived > MAX_FILE_SIZE) {
                        console.error('File too large');
                        if (process) process.kill();
                        clearTimeout(timeout);
                        controller.error(new Error('File too large'));
                        return;
                    }

                    if (bytesReceived % (10 * 1024 * 1024) === 0) {
                        console.log(`Downloaded: ${(bytesReceived / 1024 / 1024).toFixed(2)}MB`);
                    }

                    try {
                        controller.enqueue(chunk);
                    } catch (error) {
                        console.error('Enqueue error:', error);
                        if (process) process.kill();
                        clearTimeout(timeout);
                        controller.error(error);
                    }
                });

                process.stderr.on('data', (data) => {
                    const error = data.toString();
                    if (!error.includes('WARNING')) {
                        console.warn('yt-dlp error:', error);
                    }
                });

                process.on('close', (code) => {
                    clearTimeout(timeout);
                    if (code === 0) {
                        console.log(`Download complete: ${(bytesReceived / 1024 / 1024).toFixed(2)}MB`);
                        controller.close();
                    } else {
                        console.error(`yt-dlp exited with code ${code}`);
                        controller.error(new Error(`Download failed`));
                    }
                });

                process.on('error', (error) => {
                    clearTimeout(timeout);
                    console.error('Process error:', error);
                    controller.error(error);
                });
            } catch (error) {
                console.error('Stream error:', error);
                if (process) process.kill();
                controller.error(error);
            }
        },
    });
}
