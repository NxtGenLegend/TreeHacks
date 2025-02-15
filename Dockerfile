# Use Node.js LTS version
FROM node:18-slim

# Install FFmpeg for media processing
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Create data directory
RUN mkdir -p data

# Expose ports
EXPOSE 9092 8081

# Start the application
CMD ["node", "main.js"] 