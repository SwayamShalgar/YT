import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execPromise = promisify(exec);

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: 'YouTube URL is required' },
                { status: 400 }
            );
        }

        const { stdout } = await execPromise(
            `yt-dlp --dump-json "${url}"`
        );
        const info = JSON.parse(stdout);

        const qualityMap = new Map();
        for (const format of info.formats) {
            if (!format.format_id) continue;
            // Prefer qualityLabel, then resolution, then 'Audio Only'
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

            if (!qualityMap.has(format.format_id)) {
                qualityMap.set(format.format_id, {
                    format_id: format.format_id,
                    label: label.trim(),
                    quality,
                    ext: format.ext,
                    filesize: size,
                    videoOnly: format.vcodec !== 'none' && format.acodec === 'none',
                    audioOnly: format.vcodec === 'none' && format.acodec !== 'none',
                });
            }
        }


        const qualityOptions = Array.from(qualityMap.values());

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
        return NextResponse.json(
            { error: 'Failed to fetch video information', details: error.message },
            { status: 500 }
        );
    }
}
