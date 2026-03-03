FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Run as non-root user
RUN adduser -D appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
