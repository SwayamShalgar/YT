#!/usr/bin/env bash
set -e

echo "📦 Installing yt-dlp..."
# Download yt-dlp binary directly
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
chmod a+rx yt-dlp

# Make it available in PATH
export PATH="$PWD:$PATH"

echo "✅ yt-dlp installed"
yt-dlp --version

echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building Next.js app..."
npm run build

echo "✅ Build complete!"
