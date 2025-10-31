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

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return 'Unknown';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds === Infinity || isNaN(seconds)) return '...';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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
                throw new Error(data.error || 'Failed to fetch');
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
                    }
                    lastLoaded = loaded;
                    lastTime = currentTime;
                }
            }

            const blob = new Blob(chunks);
            if (total === 0) setTotalSize(blob.size);

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

            setSuccess('Downloaded! ✓');
            setDownloadProgress(100);
        } catch (err) {
            setError(err.message);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-4 px-3 sm:py-8 sm:px-4">
            <div className="max-w-2xl mx-auto w-full">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl mb-3 sm:mb-4 shadow-lg">
                        <svg className="w-8 h-8 sm:w-12 sm:h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                        YouTube Downloader
                    </h1>
                    <p className="text-xs sm:text-base text-gray-600">Download videos in any quality</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl p-4 sm:p-8 border border-gray-100 w-full">
                    {/* Input Form */}
                    <form onSubmit={handleFetchInfo} className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste YouTube URL..."
                                className="w-full px-3 sm:px-6 py-3 sm:py-4 pr-24 sm:pr-32 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-gray-700 text-sm sm:text-base transition-all"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading || !url}
                                className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs sm:text-base"
                            >
                                {loading ? '...' : 'Fetch'}
                            </button>
                        </div>
                    </form>

                    {/* Video Info Section */}
                    {videoInfo && (
                        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                            {/* Video Card */}
                            <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                                <img
                                    src={videoInfo.thumbnail}
                                    alt={videoInfo.title}
                                    className="w-full sm:w-40 h-40 sm:h-32 object-cover rounded-lg shadow-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2 line-clamp-2">
                                        {videoInfo.title}
                                    </h2>
                                    <div className="space-y-1 text-xs sm:text-base text-gray-600">
                                        <p className="flex items-center gap-2 truncate">
                                            <span className="font-semibold">By:</span> {videoInfo.author}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="font-semibold">Duration:</span> {formatDuration(videoInfo.duration)}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="font-semibold">Views:</span> {parseInt(videoInfo.viewCount).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Formats Section */}
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                    Formats
                                </h3>
                                {qualityOptions.length === 0 ? (
                                    <div className="text-center py-6 text-gray-500 text-sm">
                                        No formats available
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:space-y-3">
                                        {qualityOptions.map((opt) => (
                                            <div
                                                key={opt.format_id}
                                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="font-bold text-gray-800 text-sm sm:text-base">
                                                            {opt.quality}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {opt.ext ? `.${opt.ext}` : ''}
                                                        </span>
                                                        {opt.videoOnly && (
                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                                Video
                                                            </span>
                                                        )}
                                                        {opt.audioOnly && (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                                Audio
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs sm:text-sm text-gray-600">
                                                        {opt.filesize ? formatBytes(opt.filesize) : 'Size unknown'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDirectDownload(opt)}
                                                    disabled={downloading}
                                                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm sm:text-base"
                                                >
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Download Progress */}
                            {downloading && (
                                <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-indigo-200 animate-fadeIn">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Downloading...</span>
                                        <span className="font-bold text-indigo-600 text-sm sm:text-base">{downloadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm text-gray-600">
                                        <span>{formatBytes(downloadedSize)}</span>
                                        <span className="text-center">{formatBytes(downloadSpeed)}/s</span>
                                        <span className="text-right">{remainingTime}</span>
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            {error && (
                                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm sm:text-base animate-fadeIn">
                                    ❌ {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 text-sm sm:text-base animate-fadeIn flex items-center gap-2">
                                    ✅ {success}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}
