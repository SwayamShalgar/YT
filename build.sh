#!/usr/bin/env bash
set -e

echo "📦 Downloading yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
chmod +x yt-dlp

echo "✅ Verifying yt-dlp..."
./yt-dlp --version

echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building Next.js..."
npm run build

echo "✅ Build complete!"
