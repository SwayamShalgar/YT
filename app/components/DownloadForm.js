'use client';
import { useState } from 'react';

export default function DownloadForm() {
    const [url, setUrl] = useState('');
    const [videoInfo, setVideoInfo] = useState(null);
    const [qualityOptions, setQualityOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const detectPlatform = (inputUrl) => {
        if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) return 'youtube';
        if (inputUrl.includes('instagram.com')) return 'instagram';
        return null;
    };

    const getPlatformName = (platform) => {
        return platform === 'youtube' ? 'YouTube' : 'Instagram';
    };

    const getPlatformIcon = (platform) => {
        return platform === 'youtube' ? '🎥' : '📷';
    };

    const handleFetchInfo = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const platform = detectPlatform(url);
        if (!platform) {
            setError('Please enter a YouTube or Instagram URL');
            return;
        }

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

    const handleDownload = async (format) => {
        setError('');
        setSuccess('');
        setDownloading(true);

        const platform = detectPlatform(url);

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, format_id: format.format_id }),
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `video_${format.quality}.${format.ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            setSuccess('Downloaded! ✓');
        } catch (err) {
            setError(err.message);
        } finally {
            setDownloading(false);
        }
    };

    const platform = detectPlatform(url);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-2">
                        All Video Downloader
                    </h1>
                    <p className="text-gray-600">🎥 YouTube • 📷 Instagram</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
                    <form onSubmit={handleFetchInfo} className="mb-6">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste YouTube or Instagram URL..."
                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? 'Loading...' : 'Fetch'}
                            </button>
                        </div>
                        {platform && (
                            <p className="mt-2 text-sm text-green-600 font-medium">
                                ✓ {getPlatformIcon(platform)} {getPlatformName(platform)} URL detected
                            </p>
                        )}
                    </form>

                    {videoInfo && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                {videoInfo.thumbnail && (
                                    <img
                                        src={videoInfo.thumbnail}
                                        alt={videoInfo.title}
                                        className="w-40 h-32 object-cover rounded-lg shadow-md flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">{getPlatformIcon(platform)}</span>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                            {videoInfo.platform}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2 line-clamp-2">
                                        {videoInfo.title}
                                    </h2>
                                    <p className="text-gray-600 mb-1">
                                        <strong>By:</strong> {videoInfo.author}
                                    </p>
                                    {videoInfo.duration && (
                                        <p className="text-gray-600">
                                            <strong>Duration:</strong> {Math.floor(videoInfo.duration / 60)}:{String(videoInfo.duration % 60).padStart(2, '0')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">
                                    Available Formats ({qualityOptions.length})
                                </h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {qualityOptions.map((opt) => (
                                        <div
                                            key={opt.format_id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {opt.label}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center gap-3 flex-wrap">
                                                    <span>📦 Size: <span className="font-bold text-blue-600">{opt.filesizeLabel || 'Calculating...'}</span></span>
                                                    {opt.fps && <span>🎬 {opt.fps}fps</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(opt)}
                                                disabled={downloading}
                                                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap ml-4 text-xs sm:text-base"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 animate-fadeIn">
                            ❌ {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-green-700 animate-fadeIn">
                            ✅ {success}
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
