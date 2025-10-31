FROM node:20

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3-full \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp && \
    yt-dlp --version

# Verify Node.js version
RUN node --version && npm --version

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
