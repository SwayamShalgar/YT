import { spawn } from 'child_process';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { url, format_id } = await request.json();

        if (!url || !format_id) {
            return NextResponse.json(
                { error: 'URL and format selection are required' },
                { status: 400 }
            );
        }

        // Use yt-dlp directly
        const ytdlp = spawn('yt-dlp', [
            '-f', format_id,
            '--no-warnings',
            '-o', '-',
            url,
        ]);

        const isAudio = format_id.includes('audio') || format_id.includes('Audio');
        const ext = isAudio ? "mp3" : "mp4";
        const contentType = isAudio ? "audio/mpeg" : "video/mp4";

        const filename = `video_${format_id}.${ext}`;

        let closed = false;

        const stream = new ReadableStream({
            start(controller) {
                ytdlp.stdout.on('data', chunk => {
                    if (!closed) {
                        try {
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
                ytdlp.on('close', () => {
                    if (!closed) {
                        closed = true;
                        controller.close();
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
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': contentType,
                'Transfer-Encoding': 'chunked',
            }
        });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json(
            { error: 'Failed to download video', details: error.message },
            { status: 500 }
        );
    }
}
