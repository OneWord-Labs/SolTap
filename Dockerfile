FROM node:18-slim as base
WORKDIR /app

FROM base as build
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential

# Install TypeScript and type definitions globally
RUN npm install -g typescript @types/node

# Copy package files
COPY package*.json ./
RUN npm install --production=false

# Install additional dependencies
RUN npm install --save-dev @types/node zod debug @types/debug @types/express @types/cors @types/node-telegram-bot-api

# Create game directory and install dependencies
RUN mkdir -p game
COPY game/package*.json game/
RUN cd game && npm install --save-dev vite @vitejs/plugin-react

# Copy source files
COPY . .

# Build the application
RUN npm run build -w bot

FROM base
COPY --from=build /app/bot/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY bot/package.json ./bot/package.json

EXPOSE 8080

# Add environment check and run with proper ES module flags
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
    node --experimental-specifier-resolution=node --experimental-modules dist/server/index.js
