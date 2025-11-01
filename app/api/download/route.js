import { spawn } from 'child_process';
import { NextResponse } from 'next/server';

function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('pinterest.com')) return 'pinterest';
    return null;
}

export async function POST(request) {
    try {
        const { url, format_id } = await request.json();

        if (!url || !format_id) {
            return NextResponse.json(
                { error: 'URL and format selection are required' },
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

        // Use yt-dlp
        const ytdlp = spawn('yt-dlp', [
            '-f', format_id,
            '--no-warnings',
            '--no-playlist',
            '-o', '-',
            url,
        ]);

        const isAudio = format_id.includes('audio') || format_id.includes('Audio');
        const ext = isAudio ? "mp3" : "mp4";
        const contentType = isAudio ? "audio/mpeg" : "video/mp4";
        
        // Generate filename
        const timestamp = Date.now();
        const filename = `video_${timestamp}.${ext}`;

        let closed = false;
        const chunks = [];

        const stream = new ReadableStream({
            start(controller) {
                ytdlp.stdout.on('data', chunk => {
                    if (!closed) {
                        try {
                            chunks.push(chunk);
                            controller.enqueue(chunk);
                        } catch {
                            closed = true;
                        }
                    }
                });

                ytdlp.stdout.on('end', () => {
                    if (!closed) {
                        closed = true;
                        controller.close();
                    }
                });

                ytdlp.stderr.on('data', data => {
                    console.error('yt-dlp stderr:', data.toString());
                });

                ytdlp.on('error', error => {
                    console.error('yt-dlp error:', error);
                    if (!closed) {
                        closed = true;
                        controller.error(error);
                    }
                });

                ytdlp.on('close', (code) => {
                    if (!closed) {
                        closed = true;
                        if (code === 0) {
                            controller.close();
                        } else {
                            controller.error(new Error(`Download failed with code ${code}`));
                        }
                    }
                });
            },
            cancel() {
                ytdlp.kill();
                closed = true;
            }
        });

        return new Response(stream, {
            status: 200,
            headers: {
                // MOBILE-FRIENDLY HEADERS
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Content-Type-Options': 'nosniff',
                // Mobile Safari fix
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': 'Content-Disposition',
            },
        });
    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json(
            { error: 'Failed to download video', details: error.message },
            { status: 500 }
        );
    }
}
