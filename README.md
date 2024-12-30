# Sol Says - Telegram Game Bot Setup Guide

## Project Structure
```
.
├── bot/                 # Telegram bot server
│   ├── server/         # Server code
│   ├── .env.production # Production environment variables
│   └── fly.toml        # Fly.io deployment configuration
└── game/               # Game frontend
```

## Critical Configuration Steps

### 1. Telegram Bot Setup
1. Create bot through @BotFather:
   - Use `/newbot` command
   - Set name and username
   - Save the bot token securely

2. Create game through @BotFather:
   - Use `/newgame` command
   - Select your bot
   - Set game title and description
   - Upload photo
   - **IMPORTANT**: Save the game's short name exactly as provided by BotFather
   - The game short name is case-sensitive and must match exactly

### 2. Environment Variables
Bot server requires these exact environment variables in `bot/.env.production`:
```
TELEGRAM_BOT_TOKEN=your_bot_token
BASE_URL=https://soltap-bot.fly.dev
GAME_URL=https://app.soltap.xyz
NODE_ENV=production
GAME_SHORT_NAME=solsays        # Must match BotFather's game short name exactly
BOT_USERNAME=SolSays_bot       # Must match bot's username exactly
```

### 3. Fly.io Configuration
In `bot/fly.toml`:
```toml
app = "soltap-bot"             # Must match your fly.io app name
primary_region = "lax"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
```

## Deployment Process

1. Set up Fly.io secrets:
```bash
fly secrets set \
  TELEGRAM_BOT_TOKEN="your_bot_token" \
  BASE_URL="https://soltap-bot.fly.dev" \
  GAME_URL="https://app.soltap.xyz" \
  GAME_SHORT_NAME="solsays" \
  BOT_USERNAME="SolSays_bot" \
  -a soltap-bot
```

2. Deploy:
```bash
cd bot
fly deploy
```

3. Verify deployment:
```bash
fly status -a soltap-bot
fly logs -a soltap-bot
```

## Common Issues and Solutions

### 1. Wrong Game Short Name
- Error: "wrong game short name specified"
- Solution: 
  - Check game short name with @BotFather
  - Use EXACTLY the same name (case-sensitive)
  - Update both .env.production and fly.io secrets

### 2. Port Conflicts
If deployment fails with port conflicts:
```bash
# Force destroy existing machine
fly machine destroy --force MACHINE_ID -a soltap-bot
# Then redeploy
fly deploy
```

### 3. Webhook Issues
- Verify webhook status:
```bash
curl -X GET "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```
- Bot automatically sets webhook on startup
- Webhook URL must be HTTPS
- Webhook URL must match BASE_URL/api/webhook

## Development Setup

1. Clone repository
2. Create `.env` file in bot directory with development settings
3. Install dependencies:
```bash
cd bot
npm install
cd ../game
npm install
```

4. Start development servers:
```bash
# Bot server
cd bot
npm run dev

# Game frontend
cd game
npm run dev
```

## Critical Reminders

1. Never change the app name in fly.toml without proper migration
2. Always verify game short name with BotFather before deployment
3. Keep production and staging environments completely separate
4. Always check logs after deployment
5. Maintain separate bots for staging and production

## Troubleshooting Checklist

1. Verify environment variables match exactly
2. Confirm game short name with BotFather
3. Check webhook configuration
4. Verify fly.io app name matches deployment
5. Check server logs for specific errors
6. Verify all secrets are set in fly.io
7. Ensure bot has correct permissions

## Backup and Recovery

1. Keep backup of working configuration files
2. Document all environment variables
3. Save BotFather responses with critical information
4. Maintain deployment history in fly.io
