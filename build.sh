#!/usr/bin/env bash
# Install yt-dlp
apt-get update && apt-get install -y yt-dlp

# Install Node.js dependencies
npm install

# Build Next.js app
npm run build
