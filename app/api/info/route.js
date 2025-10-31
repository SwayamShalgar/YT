import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execPromise = promisify(exec);

function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('pinterest.com')) return 'pinterest';
    return null;
}

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
                { error: 'YouTube, Instagram, or Pinterest URL required' },
                { status: 400 }
            );
        }

        // Get info from yt-dlp with better format extraction
        const { stdout } = await execPromise(
            `yt-dlp --dump-json "${url}" 2>/dev/null`
        );

        const info = JSON.parse(stdout);
        const qualityMap = new Map();

        // Filter formats by video quality
        for (const format of info.formats || []) {
            if (!format.format_id) continue;
            
            // Skip mhtml and 3gp formats
            if (format.ext === 'mhtml' || format.ext === '3gp') continue;
            
            // Get actual filesize from yt-dlp data
            let filesize = null;
            
            if (format.filesize) {
                filesize = format.filesize;
            } else if (format.filesize_approx) {
                filesize = format.filesize_approx;
            } else if (format.tbr && info.duration) {
                // Fallback: estimate from bitrate
                filesize = Math.round((format.tbr * 1000 * info.duration) / 8);
            } else if (format.vbr && format.abr && info.duration) {
                // Video + audio bitrate
                filesize = Math.round(((format.vbr + format.abr) * 1000 * info.duration) / 8);
            } else if (format.vbr && info.duration && format.vcodec !== 'none') {
                // Video only bitrate
                filesize = Math.round((format.vbr * 1000 * info.duration) / 8);
            } else if (format.abr && info.duration && format.acodec !== 'none' && format.vcodec === 'none') {
                // Audio only bitrate
                filesize = Math.round((format.abr * 1000 * info.duration) / 8);
            }

            // Build quality label
            let quality =
                format.qualityLabel ||
                (format.height ? `${format.height}p` : '') ||
                (format.vcodec === 'none' ? 'Audio' : '') ||
                format.format_id;

            let label = quality;
            if (format.vcodec !== 'none' && format.acodec !== 'none') label += ' (Video+Audio)';
            else if (format.vcodec !== 'none' && format.acodec === 'none') label += ' (Video Only)';
            else if (format.vcodec === 'none' && format.acodec !== 'none') label += ' (Audio Only)';
            
            if (format.ext) label += ` .${format.ext}`;

            const videoOnly = format.vcodec !== 'none' && format.acodec === 'none';
            const audioOnly = format.vcodec === 'none' && format.acodec !== 'none';
            
            // Format filesize for display
            const filesizeLabel = filesize ? formatBytes(filesize) : 'Unknown';

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
                });
            }
        }

        let qualityOptions = Array.from(qualityMap.values());

        // Sort: best+audio first, then by height
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

        // Remove duplicates - keep best quality versions only
        const filteredOptions = [];
        const heightsSeen = new Set();
        
        for (const opt of qualityOptions) {
            const height = parseInt(opt.quality) || 0;
            if (!heightsSeen.has(height)) {
                filteredOptions.push(opt);
                heightsSeen.add(height);
            }
        }

        return NextResponse.json({
            videoDetails: {
                title: info.title || 'Unknown Title',
                thumbnail: info.thumbnail || '',
                duration: info.duration || 0,
                author: info.uploader || info.channel || 'Unknown',
                viewCount: info.view_count || 0,
            },
            qualityOptions: filteredOptions,
        });
    } catch (error) {
        console.error('Error fetching info:', error);
        return NextResponse.json(
            { error: 'Failed to fetch video info', details: error.message },
            { status: 500 }
        );
    }
}
