'use client';
import { useState } from 'react';

export default function DownloadForm() {
    const [url, setUrl] = useState('');
    const [videoInfo, setVideoInfo] = useState(null);
    const [qualityOptions, setQualityOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadedSize, setDownloadedSize] = useState(0);
    const [totalSize, setTotalSize] = useState(0);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [remainingTime, setRemainingTime] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Helper function for formatting size in bytes
    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return 'Audio+video (unknown size)';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Helper function for formatting remaining time
    const formatTime = (seconds) => {
        if (!seconds || seconds === Infinity || isNaN(seconds)) return 'Calculating...';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    };

    // Helper for formatting video duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Fetch video info and quality options
    const handleFetchInfo = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        setVideoInfo(null);
        setQualityOptions([]);

        try {
            const response = await fetch('/api/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch video information');
            }
            const data = await response.json();
            setVideoInfo(data.videoDetails);
            setQualityOptions(data.qualityOptions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Download function for a specific format
    const handleDirectDownload = async (format) => {
        setError('');
        setSuccess('');
        setDownloading(true);
        setDownloadProgress(0);
        setDownloadedSize(0);
        setDownloadSpeed(0);
        setRemainingTime('');
        const estimatedSize = format.filesize || 0;
        if (estimatedSize) setTotalSize(estimatedSize);

        const startTime = Date.now();
        let lastLoaded = 0;
        let lastTime = startTime;

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, format_id: format.format_id }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Download failed');
            }

            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : estimatedSize || 0;
            if (total > 0) setTotalSize(total);

            const reader = response.body.getReader();
            const chunks = [];
            let loaded = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                setDownloadedSize(loaded);

                if (total > 0) {
                    const progress = (loaded / total) * 100;
                    setDownloadProgress(Math.min(Math.round(progress), 100));
                } else {
                    setDownloadProgress(0);
                }

                const currentTime = Date.now();
                const timeDiff = (currentTime - lastTime) / 1000;
                if (timeDiff >= 0.5) {
                    const loadedDiff = loaded - lastLoaded;
                    const speed = loadedDiff / timeDiff;
                    setDownloadSpeed(speed);
                    if (total > 0 && speed > 0) {
                        const remaining = (total - loaded) / speed;
                        setRemainingTime(formatTime(remaining));
                    } else {
                        setRemainingTime('Calculating...');
                    }
                    lastLoaded = loaded;
                    lastTime = currentTime;
                }
            }

            const blob = new Blob(chunks);
            if (total === 0) {
                setTotalSize(blob.size);
                setDownloadProgress(100);
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            const contentDisposition = response.headers.get('Content-Disposition');
            const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : 'video.mp4';
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            setSuccess('Download completed successfully!');
            setRemainingTime('Complete!');
            setDownloadProgress(100);
        } catch (err) {
            setError(err.message);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-tr from-blue-100 via-purple-100 to-pink-100 py-16 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="backdrop-blur-lg bg-white/80 border border-blue-200 rounded-3xl shadow-2xl p-10">
                    <h1 className="text-5xl font-extrabold text-center mb-4 text-black tracking-tight drop-shadow">
                        YouTube Video Downloader
                    </h1>
                    <form onSubmit={handleFetchInfo} className="mb-6 space-y-4">
                        <div>
                            <label htmlFor="url" className="block text-base font-bold text-black mb-2">
                                YouTube Video URL
                            </label>
                            <input
                                type="text"
                                id="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full px-4 py-3 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-400 font-mono text-black bg-white/90 shadow-inner"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !url}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400"
                        >
                            {loading ? "Fetching Video Info..." : "Get Video Info"}
                        </button>
                    </form>

                    {videoInfo && (
                        <>
                            <div className="border border-purple-200 bg-purple-50/60 mt-6 rounded-2xl px-7 pt-6 pb-8 shadow-md">
                                <div className="flex flex-col md:flex-row gap-5 items-start w-full max-w-full">
                                    {/* ...Video details unchanged... */}
                                </div>

                                <div className="mt-7">
                                    <label className="block text-sm font-bold text-black mb-3">
                                        Available Qualities / Formats
                                    </label>
                                    {qualityOptions.length === 0 ? (
                                        <div className="text-gray-500 text-sm font-medium p-2">
                                            No qualities found for this video.
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {qualityOptions.map((opt) => (
                                                <div key={opt.format_id} className="flex flex-row justify-between items-center ...">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-black text-lg">
                                                            {/* Show quality (+ extension), always */}
                                                            {opt.quality}
                                                            {opt.ext ? ` .${opt.ext}` : ''}
                                                        </span>
                                                        <span className="text-xs text-gray-900">
                                                            {/* Optionally show descriptor: Video Only, Audio Only, Video+Audio */}
                                                            {opt.label && !opt.label.startsWith(opt.quality) && opt.label}
                                                        </span>
                                                        <span className="text-sm text-black">
                                                            {opt.filesize ? formatBytes(opt.filesize) : 'Audio+video (unknown size)'}
                                                        </span>
                                                        {opt.videoOnly && (
                                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 mt-1 rounded font-medium w-max">
                                                                Video Only
                                                            </span>
                                                        )}
                                                        {opt.audioOnly && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 mt-1 rounded font-medium w-max">
                                                                Audio Only
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDirectDownload(opt)}
                                                        className="px-4 py-2 rounded bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-800 text-white font-bold text-base shadow disabled:bg-gray-400"
                                                        disabled={downloading}
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            ))}

                                        </div>
                                    )}
                                </div>

                                {downloading && (
                                    <div className="mt-6 bg-white border border-blue-100/60 p-4 rounded-lg shadow-sm backdrop-blur-md">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-base font-semibold text-black">
                                                Downloading... {downloadProgress > 0 ? `${downloadProgress}%` : ''}
                                            </span>
                                            <span className="text-base">
                                                {formatBytes(downloadedSize)}
                                                {totalSize > 0 ? ` / ${formatBytes(totalSize)}` : ''}
                                            </span>
                                        </div>
                                        <div className="w-full bg-blue-200 rounded-full h-5 overflow-hidden mb-3 shadow-inner">
                                            {totalSize > 0 ? (
                                                <div
                                                    className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 h-5 rounded-full transition-all duration-300 flex items-center justify-center text-xs text-white font-bold"
                                                    style={{ width: `${downloadProgress}%` }}
                                                >
                                                    {downloadProgress > 5 && `${downloadProgress}%`}
                                                </div>
                                            ) : (
                                                <div className="bg-linear-to-r from-blue-500 to-green-500 h-5 rounded-full animate-pulse w-full flex items-center justify-center text-xs text-white font-bold">
                                                    Downloading...
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-10 text-base font-medium mt-1">
                                            <span className="flex gap-2 items-center text-black">
                                                <svg className="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Speed: {formatBytes(downloadSpeed)}/s
                                            </span>
                                            <span className="flex gap-2 items-center text-black">
                                                <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Time left: {remainingTime || 'Calculating...'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {success && (
                                    <div className="mt-4 px-4 py-3 rounded-lg bg-green-100 text-green-700 font-semibold shadow">
                                        {success}
                                    </div>
                                )}
                                {error && (
                                    <div className="mt-4 px-4 py-3 rounded-lg bg-red-100 text-red-700 font-semibold shadow">
                                        {error}
                                    </div>
                                )}

                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
