# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SolTap is a Telegram-integrated game with a monorepo structure containing three main workspaces:
- `game/` - Phaser-based game frontend deployed to Vercel
- `bot/` - Telegram bot server deployed to Fly.io
- `shared/` - Shared utilities and configurations

## Development Commands

### Root-level commands
```bash
# Install all dependencies
npm install

# Build shared package first (required before running bot/game)
npm run build -w shared

# Run both game and bot in development mode
npm run dev

# Build all packages
npm run build

# Clean all build outputs
npm run clean
```

### Game development
```bash
# Run game development server (port 3000)
npm run dev -w game

# Build game for production
npm run build -w game

# Preview production build
npm run preview -w game
```

### Bot development
```bash
# Run bot development server with hot reload (port 8080)
npm run dev -w bot

# Build bot TypeScript code
npm run build -w bot

# Run production server
npm run start -w bot

# Run with debug logging
npm run start:debug -w bot
```

## Architecture Overview

### Project Structure
The monorepo uses npm workspaces with ES modules (`"type": "module"`). All TypeScript files compile to ES modules with proper `.js` extensions in imports.

### Bot Architecture
- **Express server** (`bot/server/index.ts`): Handles Telegram webhooks and score updates
- **TelegramService** (`bot/services/telegram/telegram.service.ts`): Singleton service managing Telegram bot API interactions
- **Environment validation**: Bot validates required environment variables on startup and exits if missing

Key endpoints:
- `/api/webhook` - Receives Telegram webhook updates
- `/api/health` - Health check endpoint
- `/api/score` - Updates user scores from the game

### Game Architecture
- **Phaser 3 game engine**: Scene-based game with MainScene and MenuScene
- **React integration**: Game embedded in React component with Tailwind CSS
- **Telegram WebApp SDK**: Integrated for user authentication and score submission

Game structure:
- `game/src/game/scenes/` - Phaser scenes (MenuScene, MainScene)
- `game/src/game/managers/` - Game state and object pool management
- `game/src/game/controllers/` - Button and pattern controllers
- `game/src/game/utils/` - Audio, pattern generation, rewards, transitions
- `game/src/game/services/` - Telegram integration services

### Deployment Architecture

**Bot (Fly.io)**:
- Docker-based deployment with Node.js 18 Alpine
- Builds shared and bot packages in container
- Auto-scaling with min 0 machines (cold start enabled)
- HTTPS enforced with automatic SSL

**Game (Vercel)**:
- Vite-based build with TypeScript
- API rewrites to Railway backend: `/api/*` → `https://sol-tap-v2-stable-production.up.railway.app/api/*`
- Deployed to game subdomain (separate from main site)

## Critical Configuration Requirements

### Telegram Bot Setup
1. Bot token from @BotFather must be exact
2. Game short name is **case-sensitive** - must match exactly as provided by BotFather
3. Webhook URL must be HTTPS: `https://{BASE_URL}/api/webhook`
4. Bot automatically sets webhook on startup

### Required Environment Variables

Bot deployment (Fly.io):
```bash
TELEGRAM_BOT_TOKEN    # From @BotFather
BASE_URL             # Your fly.dev domain
GAME_SHORT_NAME      # Exact game name from @BotFather (case-sensitive)
GAME_URL            # Full game URL
```

Game deployment (Vercel):
```bash
VITE_API_URL        # Backend API URL
VITE_GAME_SHORT_NAME # Same as bot's GAME_SHORT_NAME
```

### TypeScript Configuration
- All workspaces use ES2020 target with ES modules
- Bot uses `moduleResolution: "node"` for Node.js compatibility
- Game uses `moduleResolution: "bundler"` for Vite bundling
- Strict mode enabled across all packages

## Common Troubleshooting

### Build Issues
- Always build shared package first: `npm run build -w shared`
- Clean builds if encountering module resolution issues: `npm run clean`
- Ensure Node.js 18.x is being used

### Deployment Issues
- Verify all environment variables are set in deployment platform
- Check webhook status: `curl -X GET "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`
- For Fly.io: Use `fly logs` to monitor deployment and runtime logs
- For Vercel: Check build logs in Vercel dashboard

### Module Resolution
- All imports must use `.js` extensions (even for TypeScript files)
- Use `--experimental-specifier-resolution=node` flag when running compiled bot code
- TypeScript configured to handle ES modules properly in each workspace

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
