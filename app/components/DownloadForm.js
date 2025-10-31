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
        if (!bytes || bytes === 0) return 'Audio+Video (Unknown Size)';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds === Infinity || isNaN(seconds)) return 'Calculating...';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </div>
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                        YouTube Downloader
                    </h1>
                    <p className="text-gray-600 text-lg">Download videos in any quality, quickly and easily</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                    <form onSubmit={handleFetchInfo} className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste YouTube URL here..."
                                className="w-full px-6 py-4 pr-32 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-gray-700 text-lg transition-all"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading || !url}
                                className="absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                ) : 'Fetch'}
                            </button>
                        </div>
                    </form>

                    {/* Video Info */}
                    {videoInfo && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Video Preview */}
                            <div className="flex gap-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                                <img
                                    src={videoInfo.thumbnail}
                                    alt={videoInfo.title}
                                    className="w-48 h-36 object-cover rounded-xl shadow-lg"
                                />
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-3 line-clamp-2">
                                        {videoInfo.title}
                                    </h2>
                                    <div className="space-y-1 text-gray-600">
                                        <p className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            {videoInfo.author}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formatDuration(videoInfo.duration)}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {parseInt(videoInfo.viewCount).toLocaleString()} views
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quality Options */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                    Available Formats
                                </h3>
                                {qualityOptions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No qualities found for this video.
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {qualityOptions.map((opt) => (
                                            <div
                                                key={opt.format_id}
                                                className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg font-bold text-gray-800">
                                                            {opt.quality}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {opt.ext ? `.${opt.ext}` : ''}
                                                        </span>
                                                        {opt.videoOnly && (
                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                                Video Only
                                                            </span>
                                                        )}
                                                        {opt.audioOnly && (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                                Audio Only
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                                                        {opt.filesize ? formatBytes(opt.filesize) : 'Audio+Video (Unknown Size)'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDirectDownload(opt)}
                                                    disabled={downloading}
                                                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Progress */}
                            {downloading && (
                                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-indigo-200 animate-fadeIn">
                                    <div className="flex justify-between mb-3">
                                        <span className="font-semibold text-gray-800">Downloading...</span>
                                        <span className="font-bold text-indigo-600">{downloadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>{formatBytes(downloadedSize)} / {formatBytes(totalSize)}</span>
                                        <span>{formatBytes(downloadSpeed)}/s</span>
                                        <span>{remainingTime}</span>
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            {error && (
                                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 animate-fadeIn">
                                    <strong>Error:</strong> {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 animate-fadeIn flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {success}
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
