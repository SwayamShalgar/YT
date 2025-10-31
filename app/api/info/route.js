import { spawn } from 'child_process';

const REQUEST_TIMEOUT = 20000;

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return new Response(JSON.stringify({ error: 'URL required' }), { status: 400 });
        }

        if (!isValidUrl(url)) {
            return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400 });
        }

        const videoDetails = await getVideoInfo(url);
        const qualityOptions = await getQualityOptions(url);

        return new Response(JSON.stringify({
            videoDetails,
            qualityOptions,
        }), { status: 200 });
    } catch (error) {
        console.error('Info error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to fetch' }), { status: 500 });
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

function getPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('pinterest.com')) return 'Pinterest';
    return 'Unknown';
}

async function getVideoInfo(url) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Video info timeout'));
        }, REQUEST_TIMEOUT);

        const ytdlp = spawn('yt-dlp', ['-j', '--quiet', '--no-warnings', url]);
        let output = '';

        ytdlp.stdout.on('data', (data) => {
            output += data.toString();
        });

        ytdlp.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                try {
                    const data = JSON.parse(output);
                    resolve({
                        title: data.title || 'Unknown',
                        author: data.uploader || data.channel || 'Unknown',
                        thumbnail: data.thumbnail || '',
                        duration: data.duration || 0,
                        platform: getPlatform(url),
                    });
                } catch (error) {
                    reject(new Error('Failed to parse video info'));
                }
            } else {
                reject(new Error('Failed to get video info'));
            }
        });

        ytdlp.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

async function getQualityOptions(url) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve([]);
        }, REQUEST_TIMEOUT);

        const ytdlp = spawn('yt-dlp', ['-F', '--quiet', '--no-warnings', url]);
        let output = '';

        ytdlp.stdout.on('data', (data) => {
            output += data.toString();
        });

        ytdlp.on('close', () => {
            clearTimeout(timeout);
            const options = parseFormats(output);
            resolve(options);
        });

        ytdlp.on('error', () => {
            clearTimeout(timeout);
            resolve([]);
        });
    });
}

function parseFormats(output) {
    const lines = output.split('\n');
    const formats = [];

    lines.forEach((line) => {
        if (line.includes('video') || line.includes('audio')) {
            const parts = line.trim().split(/\s+/);
            if (parts[0]) {
                const format = {
                    format_id: parts[0],
                    quality: extractQuality(line),
                    ext: extractExt(line),
                    audioOnly: line.includes('audio only'),
                    filesize: extractFilesize(line),
                };
                formats.push(format);
            }
        }
    });

    return formats.sort((a, b) => {
        const qualityA = parseInt(a.quality) || 0;
        const qualityB = parseInt(b.quality) || 0;
        return qualityB - qualityA;
    });
}

function extractQuality(line) {
    const match = line.match(/(\d+p)/);
    return match ? match[1] : 'Unknown';
}

function extractExt(line) {
    const match = line.match(/\[(\w+)\]/);
    return match ? match[1] : 'mp4';
}

function extractFilesize(line) {
    const match = line.match(/(\d+\.\d+[KMG]iB)/);
    return match ? match[1] : null;
}
