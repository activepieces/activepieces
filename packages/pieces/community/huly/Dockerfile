FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY dist/ ./dist/

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
