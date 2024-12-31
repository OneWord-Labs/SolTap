FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY bot/package*.json ./bot/
COPY game/package*.json ./game/

# Install dependencies
RUN npm install
RUN npm install -g typescript vite

# Copy source files
COPY . .

# Build shared first, then bot
RUN npm run build -w shared && npm run build -w bot

EXPOSE 8080

# Set default environment variables
ENV HOST=0.0.0.0 \
    PORT=8080 \
    NODE_ENV=production

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
    if [ -z "$GAME_URL" ]; then \
      echo "Error: GAME_URL is not set"; \
      exit 1; \
    fi; \
    node --experimental-specifier-resolution=node --experimental-modules --es-module-specifier-resolution=node bot/dist/server/index.js
