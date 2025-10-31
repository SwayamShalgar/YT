import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import path from 'path';

const execPromise = promisify(exec);

// Use local yt-dlp binary
const YTDLP_PATH = path.join(process.cwd(), 'yt-dlp');

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: 'YouTube URL is required' },
                { status: 400 }
            );
        }

        // Use local yt-dlp binary
        const { stdout } = await execPromise(
            `${YTDLP_PATH} --dump-json "${url}"`
        );
        const info = JSON.parse(stdout);

        const qualityMap = new Map();

        for (const format of info.formats) {
            if (!format.format_id) continue;

            // Skip unwanted formats
            if (format.ext === 'mhtml' || format.ext === '3gp') continue;

            let quality =
                format.qualityLabel ||
                (format.height ? `${format.height}p` : '') ||
                (format.vcodec === 'none' ? 'Audio Only' : '') ||
                format.format_id;

            let label = quality;
            if (format.vcodec !== 'none' && format.acodec !== 'none') label += ' (Video+Audio)';
            if (format.vcodec !== 'none' && format.acodec === 'none') label += ' (Video Only)';
            if (format.vcodec === 'none' && format.acodec !== 'none') label += ' (Audio Only)';
            if (format.ext) label += ` .${format.ext}`;

            const size = format.filesize || format.filesize_approx || null;
            const videoOnly = format.vcodec !== 'none' && format.acodec === 'none';
            const audioOnly = format.vcodec === 'none' && format.acodec !== 'none';

            if (!qualityMap.has(format.format_id)) {
                qualityMap.set(format.format_id, {
                    format_id: format.format_id,
                    label: label.trim(),
                    quality,
                    ext: format.ext,
                    filesize: size,
                    videoOnly,
                    audioOnly,
                });
            }
        }

        let qualityOptions = Array.from(qualityMap.values());

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
                author: info.uploader,
                viewCount: info.view_count,
            },
            qualityOptions,
        });
    } catch (error) {
        console.error('Error fetching video info:', error);
        return NextResponse.json(
            { error: 'Failed to fetch video information', details: error.message },
            { status: 500 }
        );
    }
}
