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
    NODE_ENV=production \
    BASE_URL=soltap-bot-main.fly.dev \
    GAME_SHORT_NAME=SolTap \
    GAME_URL=https://soltap-bot-main.fly.dev/game

# Run with ES module flags
CMD ["node", "--experimental-specifier-resolution=node", "--experimental-modules", "--es-module-specifier-resolution=node", "bot/dist/server/index.js"]
