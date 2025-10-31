import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execPromise = promisify(exec);

function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    return null;
}

// Format bytes to readable format
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return null;
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        const platform = detectPlatform(url);

        if (!platform) {
            return NextResponse.json(
                { error: 'YouTube or Instagram URL required' },
                { status: 400 }
            );
        }

        // Get info from yt-dlp
        const { stdout } = await execPromise(
            `yt-dlp --dump-json "${url}"`
        );

        const info = JSON.parse(stdout);
        const qualityMap = new Map();

        // Process all available formats
        for (const format of info.formats) {
            if (!format.format_id) continue;
            if (format.ext === 'mhtml' || format.ext === '3gp') continue;

            // Calculate filesize
            let filesize = format.filesize || format.filesize_approx;
            
            // If no filesize, try to estimate from bitrate
            if (!filesize && format.tbr && format.duration) {
                filesize = Math.round((format.tbr * 1024 * format.duration) / 8);
            }

            // Get quality label
            let quality =
                format.qualityLabel ||
                (format.height ? `${format.height}p` : '') ||
                (format.vcodec === 'none' ? 'Audio' : '') ||
                format.format_id;

            let label = quality;
            if (format.vcodec !== 'none' && format.acodec !== 'none') label += ' (Video+Audio)';
            if (format.vcodec !== 'none' && format.acodec === 'none') label += ' (Video Only)';
            if (format.vcodec === 'none' && format.acodec !== 'none') label += ' (Audio Only)';
            if (format.ext) label += ` .${format.ext}`;

            const videoOnly = format.vcodec !== 'none' && format.acodec === 'none';
            const audioOnly = format.vcodec === 'none' && format.acodec !== 'none';

            // Get estimated filesize with label
            const filesizeLabel = filesize ? formatBytes(filesize) : 'Calculating...';

            if (!qualityMap.has(format.format_id)) {
                qualityMap.set(format.format_id, {
                    format_id: format.format_id,
                    label: label.trim(),
                    quality,
                    ext: format.ext,
                    filesize: filesize,
                    filesizeLabel: filesizeLabel,
                    videoOnly,
                    audioOnly,
                    fps: format.fps || null,
                    bitrate: format.tbr || null,
                });
            }
        }

        let qualityOptions = Array.from(qualityMap.values());

        // Sort by priority: best+audio first, then by height
        qualityOptions.sort((a, b) => {
            const priorityA = (!a.videoOnly && !a.audioOnly) ? 0 : (a.videoOnly ? 1 : 2);
            const priorityB = (!b.videoOnly && !b.audioOnly) ? 0 : (b.videoOnly ? 1 : 2);
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            const heightA = parseInt(a.quality) || 0;
            const heightB = parseInt(b.quality) || 0;
            return heightB - heightA;
        });

        return NextResponse.json({
            videoDetails: {
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                author: info.uploader || info.channel || 'Unknown',
                viewCount: info.view_count,
                platform: platform === 'youtube' ? 'YouTube' : 'Instagram',
            },
            qualityOptions,
        });
    } catch (error) {
        console.error('Error fetching info:', error);
        return NextResponse.json(
            { error: 'Failed to fetch information', details: error.message },
            { status: 500 }
        );
    }
}
