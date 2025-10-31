FROM node:18

# Install system dependencies first
RUN apt-get update && apt-get install -y \
    python3-full \
    python3-pip \
    python3-venv \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp with --break-system-packages flag
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp

# Verify yt-dlp is installed
RUN yt-dlp --version

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy all files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
