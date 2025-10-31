import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execPromise = promisify(exec);

// Detect platform from URL
function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    return null;
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

        // YouTube logic (unchanged)
        if (platform === 'youtube') {
            const { stdout } = await execPromise(
                `yt-dlp --dump-json "${url}"`
            );

            const info = JSON.parse(stdout);
            const qualityMap = new Map();

            for (const format of info.formats) {
                if (!format.format_id) continue;
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
                    platform: 'YouTube',
                },
                qualityOptions,
            });
        }

        // Instagram logic (new)
        if (platform === 'instagram') {
            const { stdout } = await execPromise(
                `yt-dlp --dump-json "${url}"`
            );

            const info = JSON.parse(stdout);
            const qualityMap = new Map();

            for (const format of info.formats) {
                if (!format.format_id) continue;

                let quality =
                    format.qualityLabel ||
                    (format.height ? `${format.height}p` : '') ||
                    format.format_id;

                let label = quality;
                if (format.ext) label += ` .${format.ext}`;

                const size = format.filesize || format.filesize_approx || null;

                if (!qualityMap.has(format.format_id)) {
                    qualityMap.set(format.format_id, {
                        format_id: format.format_id,
                        label: label.trim(),
                        quality,
                        ext: format.ext,
                        filesize: size,
                        videoOnly: false,
                        audioOnly: false,
                    });
                }
            }

            let qualityOptions = Array.from(qualityMap.values());

            return NextResponse.json({
                videoDetails: {
                    title: info.title || 'Instagram Video',
                    thumbnail: info.thumbnail || '',
                    duration: info.duration || 0,
                    author: info.uploader || 'Instagram User',
                    platform: 'Instagram',
                },
                qualityOptions,
            });
        }
    } catch (error) {
        console.error('Error fetching info:', error);
        return NextResponse.json(
            { error: 'Failed to fetch information', details: error.message },
            { status: 500 }
        );
    }
}
