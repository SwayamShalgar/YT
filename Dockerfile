FROM node:18-alpine

# Install yt-dlp dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg && \
    pip3 install yt-dlp

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci --only=production

# Copy project
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
