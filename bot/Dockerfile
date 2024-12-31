FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY bot/package*.json ./bot/

# Install dependencies
RUN npm install

# Install TypeScript globally
RUN npm install -g typescript

# Copy source files
COPY . .

# Build shared package first, then bot
RUN npm run build -w shared && npm run build -w bot

# List files in dist directory
RUN ls -la bot/dist/server/

# Verify the build output exists
RUN ls -la bot/dist/server/index.js || exit 1

# Expose the port
EXPOSE 8080

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8080
ENV NODE_OPTIONS="--experimental-specifier-resolution=node"

# Set working directory to bot
WORKDIR /app/bot

# Validate environment variables and run the application
CMD if [ -z "$TELEGRAM_BOT_TOKEN" ]; then \
      echo "Error: TELEGRAM_BOT_TOKEN is not set"; \
      exit 1; \
    fi; \
    if [ -z "$BASE_URL" ]; then \
      echo "Error: BASE_URL is not set"; \
      exit 1; \
    fi; \
    if [ -z "$GAME_SHORT_NAME" ]; then \
      echo "Error: GAME_SHORT_NAME is not set"; \
      exit 1; \
    fi; \
    node dist/server/index.js
