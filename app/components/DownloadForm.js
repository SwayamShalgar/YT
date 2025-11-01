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
    const [expandedVideos, setExpandedVideos] = useState(false);
    const [expandedAudio, setExpandedAudio] = useState(false);

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
        setExpandedVideos(false);
        setExpandedAudio(false);

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

        // Create blob from chunks
        const blob = new Blob(chunks, { type: format.audioOnly ? 'audio/mpeg' : 'video/mp4' });
        if (total === 0) setTotalSize(blob.size);

        // Generate proper filename
        const sanitizeTitle = (title) => {
            return title
                .replace(/[^\w\s-]/g, '') // Remove special chars
                .replace(/\s+/g, '_')     // Replace spaces with underscore
                .substring(0, 50);        // Limit length
        };

        const videoTitle = videoInfo?.title ? sanitizeTitle(videoInfo.title) : 'video';
        const timestamp = new Date().getTime();
        const extension = format.audioOnly ? 'mp3' : 'mp4';
        const filename = `${videoTitle}_${format.quality}_${timestamp}.${extension}`;

        // Create download link and trigger download
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = filename;
        
        // Important: Add to DOM before clicking
        document.body.appendChild(a);
        
        // Trigger download
        a.click();
        
        // Cleanup after a short delay
        setTimeout(() => {
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        }, 100);

        setSuccess('Downloaded successfully! Check your Downloads folder ✓');
        setDownloadProgress(100);
        
    } catch (err) {
        console.error('Download error:', err);
        setError(err.message || 'Download failed. Please try again.');
    } finally {
        setDownloading(false);
    }
};


    // Separate formats: MP4 video only, and audio only
    const mp4VideoFormats = qualityOptions.filter(
        opt => !opt.audioOnly && opt.ext === 'mp4'
    );
    const audioFormats = qualityOptions.filter(opt => opt.audioOnly);

    // Items to display (3 initially)
    const visibleVideoFormats = expandedVideos ? mp4VideoFormats : mp4VideoFormats.slice(0, 3);
    const visibleAudioFormats = expandedAudio ? audioFormats : audioFormats.slice(0, 3);

    const renderFormatCard = (opt, isAudio = false) => (
        <div
            key={opt.format_id}
            className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 bg-white border-2 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-102 ${
                isAudio 
                    ? 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30' 
                    : 'border-red-200 hover:border-red-400 hover:bg-red-50/30'
            }`}
        >
            <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                        isAudio 
                            ? 'bg-linear-to-r from-emerald-500 to-green-600' 
                            : 'bg-linear-to-r from-red-500 to-rose-600'
                    }`}>
                        {opt.quality}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {opt.ext ? `.${opt.ext}` : 'Unknown'}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        isAudio 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                    }`}>
                        {isAudio ? '🎵 Audio' : '📹 Video'}
                    </span>
                </div>
                <div className="text-sm text-gray-700 font-medium">
                    📦 <span className={`font-bold ${
                        isAudio ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                        {opt.filesize ? formatBytes(opt.filesize) : 'Unknown size'}
                    </span>
                </div>
            </div>
            <button
                type="button"
                onClick={() => handleDirectDownload(opt)}
                disabled={downloading}
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-2xl ${
                    isAudio 
                        ? 'bg-linear-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700' 
                        : 'bg-linear-to-r from-red-500 via-rose-500 to-pink-600 hover:from-red-600 hover:via-rose-600 hover:to-pink-700'
                }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {downloading ? 'Downloading...' : 'Download'}
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-900 to-slate-950 py-4 px-3 sm:py-8 sm:px-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-6xl mx-auto w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-red-500 via-pink-500 to-purple-600 rounded-3xl mb-4 sm:mb-6 shadow-2xl transform hover:scale-110 transition-transform duration-300 relative">
                        <div className="absolute inset-0 bg-linear-to-br from-red-500 via-pink-500 to-purple-600 rounded-3xl blur-lg opacity-50"></div>
                        <svg className="w-10 h-10 sm:w-14 sm:h-14 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-red-400 via-pink-400 to-purple-400 mb-2 drop-shadow-lg">
                        Download Videos
                    </h1>
                    <p className="text-lg sm:text-xl text-purple-200 font-semibold">🎥 YouTube • 📷 Instagram</p>
                </div>

                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl sm:rounded-4xl shadow-2xl p-6 sm:p-10 border border-white/20 w-full hover:border-white/30 transition-all duration-300">
                    {/* Input Form */}
                    <form onSubmit={handleFetchInfo} className="mb-8">
                        <div className="relative group">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste YouTube or Instagram URL..."
                                className="w-full px-5 sm:px-7 py-4 sm:py-5 pr-24 sm:pr-32 border-2 border-white/30 rounded-2xl bg-white/5 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-white placeholder-gray-400 text-sm sm:text-base transition-all duration-300 backdrop-blur-sm"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading || !url}
                                className="absolute right-2 sm:right-3 top-2 sm:top-2.5 px-5 sm:px-7 py-2.5 bg-linear-to-r from-red-500 via-pink-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs sm:text-base shadow-lg"
                            >
                                {loading ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="animate-spin">⚙️</span> Loading
                                    </span>
                                ) : 'Fetch'}
                            </button>
                        </div>
                    </form>

                    {/* Video Info Section */}
                    {videoInfo && (
                        <div className="space-y-6 sm:space-y-8 animate-fadeInUp">
                            {/* Video Card */}
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-6 sm:p-8 bg-linear-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300">
                                <img
                                    src={videoInfo.thumbnail}
                                    alt={videoInfo.title}
                                    className="w-full sm:w-48 h-40 sm:h-40 object-cover rounded-xl shadow-xl shrink-0 transform hover:scale-105 transition-transform duration-300"
                                />
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 line-clamp-2 leading-tight">
                                        {videoInfo.title}
                                    </h2>
                                    <div className="space-y-2">
                                        <p className="flex items-center gap-3 text-purple-200 text-sm sm:text-base">
                                            <span className="text-lg">👤</span>
                                            <span><strong>By:</strong> {videoInfo.author}</span>
                                        </p>
                                        <p className="flex items-center gap-3 text-purple-200 text-sm sm:text-base">
                                            <span className="text-lg">⏱️</span>
                                            <span><strong>Duration:</strong> {formatDuration(videoInfo.duration)}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* TWO COLUMN LAYOUT */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                                {/* VIDEO COLUMN */}
                                <div className="space-y-4">
                                    <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 mb-4">
                                        <span className="p-2 bg-linear-to-br from-red-500 to-rose-600 rounded-lg">
                                            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </span>
                                        Video Formats
                                    </h3>
                                    {mp4VideoFormats.length === 0 ? (
                                        <div className="text-center py-12 text-gray-300 text-sm bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                            No video formats available
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {visibleVideoFormats.map((opt) => renderFormatCard(opt, false))}
                                            </div>

                                            {/* Show More Button for Videos */}
                                            {mp4VideoFormats.length > 3 && (
                                                <button
                                                    onClick={() => setExpandedVideos(!expandedVideos)}
                                                    className="w-full mt-4 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 backdrop-blur-sm"
                                                >
                                                    {expandedVideos ? (
                                                        <>
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                            </svg>
                                                            Show Less
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                            </svg>
                                                            Show More ({mp4VideoFormats.length - 3} more)
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* AUDIO COLUMN */}
                                <div className="space-y-4">
                                    <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 mb-4">
                                        <span className="p-2 bg-linear-to-br from-emerald-500 to-green-600 rounded-lg">
                                            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                        </span>
                                        Audio Formats
                                    </h3>
                                    {audioFormats.length === 0 ? (
                                        <div className="text-center py-12 text-gray-300 text-sm bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                            No audio formats available
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {visibleAudioFormats.map((opt) => renderFormatCard(opt, true))}
                                            </div>

                                            {/* Show More Button for Audio */}
                                            {audioFormats.length > 3 && (
                                                <button
                                                    onClick={() => setExpandedAudio(!expandedAudio)}
                                                    className="w-full mt-4 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 backdrop-blur-sm"
                                                >
                                                    {expandedAudio ? (
                                                        <>
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                            </svg>
                                                            Show Less
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                            </svg>
                                                            Show More ({audioFormats.length - 3} more)
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Download Progress */}
                            {downloading && (
                                <div className="p-6 sm:p-8 bg-linear-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl border-2 border-blue-400/50 backdrop-blur-sm animate-fadeInUp">
                                    <div className="flex justify-between mb-3">
                                        <span className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                                            <span className="animate-spin">⚙️</span> Downloading...
                                        </span>
                                        <span className="font-bold text-blue-300 text-base sm:text-lg">
                                            {totalSize > 0 ? `${downloadProgress}%` : 'Processing...'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-3 mb-4 overflow-hidden border border-white/30">
                                        <div
                                            className="h-3 rounded-full transition-all duration-300 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 shadow-lg shadow-purple-500/50"
                                            style={{ width: totalSize > 0 ? `${downloadProgress}%` : '100%' }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm text-purple-200 font-semibold">
                                        <div>
                                            <div className="text-gray-300 text-xs">Downloaded</div>
                                            {formatBytes(downloadedSize)}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-gray-300 text-xs">Speed</div>
                                            {formatBytes(downloadSpeed)}/s
                                        </div>
                                        <div className="text-right">
                                            <div className="text-gray-300 text-xs">Remaining</div>
                                            {remainingTime}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            {error && (
                                <div className="p-4 sm:p-6 bg-red-500/20 border-2 border-red-400/50 rounded-xl text-red-200 text-sm sm:text-base font-semibold animate-fadeInUp backdrop-blur-sm flex items-center gap-3">
                                    <span className="text-2xl">❌</span>
                                    <span>{error}</span>
                                </div>
                            )}
                            {success && (
                                <div className="p-4 sm:p-6 bg-green-500/20 border-2 border-green-400/50 rounded-xl text-green-200 text-sm sm:text-base font-semibold animate-fadeInUp backdrop-blur-sm flex items-center gap-3">
                                    <span className="text-2xl">✅</span>
                                    <span>{success}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.6s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                .hover\:scale-102:hover {
                    transform: scale(1.02);
                }
            `}</style>
        </div>
    );
}
