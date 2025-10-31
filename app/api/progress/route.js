import { spawn } from 'child_process';

export async function POST(request) {
  try {
    const { url, quality } = await request.json();

    if (!url || !quality) {
      return new Response('Missing parameters', { status: 400 });
    }

    let formatArgs;

    if (quality === 'Audio Only (MP3)') {
      formatArgs = [
        '-f', 'bestaudio',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0'
      ];
    } else {
      const qualityMap = {
        '2160p': 'bestvideo[height<=2160]+bestaudio',
        '1440p': 'bestvideo[height<=1440]+bestaudio',
        '1080p': 'bestvideo[height<=1080]+bestaudio',
        '720p': 'bestvideo[height<=720]+bestaudio',
        '480p': 'bestvideo[height<=480]+bestaudio',
        '360p': 'bestvideo[height<=360]+bestaudio',
      };

      const format = qualityMap[quality] || 'best';
      formatArgs = ['-f', format, '--merge-output-format', 'mp4'];
    }

    // Create a stream for Server-Sent Events
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        const ytdlp = spawn('yt-dlp', [
          ...formatArgs,
          '--newline',
          '--progress',
          '--no-warnings',
          '-o', '-',
          url
        ]);

        ytdlp.stderr.on('data', (data) => {
          const output = data.toString();
          
          // Parse progress from yt-dlp output
          const percentMatch = output.match(/(\d+\.\d+)%/);
          const speedMatch = output.match(/(\d+\.\d+\w+\/s)/);
          const etaMatch = output.match(/ETA\s+([\d:]+)/);
          
          if (percentMatch) {
            const progressData = {
              percent: parseFloat(percentMatch[1]),
              speed: speedMatch ? speedMatch[1] : 'N/A',
              eta: etaMatch ? etaMatch[1] : 'N/A',
            };
            
            // Send SSE event
            const message = `data: ${JSON.stringify(progressData)}\n\n`;
            controller.enqueue(encoder.encode(message));
          }
        });

        ytdlp.on('close', (code) => {
          if (code === 0) {
            controller.enqueue(encoder.encode('data: {"percent": 100, "status": "complete"}\n\n'));
          }
          controller.close();
        });

        ytdlp.on('error', (error) => {
          console.error('yt-dlp error:', error);
          controller.error(error);
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Progress error:', error);
    return new Response('Error', { status: 500 });
  }
}
