FROM node:18-alpine

# Install git and openssh
RUN apk add --no-cache git openssh-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY server.js ./
COPY public/ ./public/

# Create directory for website files
RUN mkdir -p /app/website

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["npm", "start"]