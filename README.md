# SolTap Telegram Bot

A Telegram bot for the SolTap game, built with Node.js, TypeScript, and deployed on fly.io.

## Project Structure

```
.
├── bot/              # Telegram bot server
│   ├── server/      # Server code
│   ├── services/    # Bot services
│   └── utils/       # Utilities
├── shared/          # Shared code between bot and game
├── game/            # Game frontend
└── fly.toml         # Fly.io configuration
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

Create a `.env` file in the `bot` directory with the following variables:

```env
# Development
TELEGRAM_BOT_TOKEN=your_bot_token
BASE_URL=http://localhost:8080
GAME_SHORT_NAME=your_game_short_name
GAME_URL=http://localhost:3000
NODE_ENV=development

# Production
TELEGRAM_BOT_TOKEN=your_bot_token
BASE_URL=your-app.fly.dev
GAME_SHORT_NAME=your_game_short_name
GAME_URL=https://your-app.fly.dev/game
NODE_ENV=production
```

For production on fly.io, these variables are set using `fly secrets`.

### 3. Fly.io Configuration

```toml
app = "your-app-name"
primary_region = "lax"

[build]
  dockerfile = "bot/Dockerfile"

[env]
  PORT = "8080"
  HOST = "0.0.0.0"
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024
```

## Development Setup

1. Clone repository
2. Create `.env` file in bot directory with development settings
3. Install dependencies:
```bash
npm install
```

4. Build the shared package:
```bash
npm run build -w shared
```

5. Build and run the bot:
```bash
npm run build -w bot
npm run dev -w bot
```

## Deployment to fly.io

1. Install the Fly CLI:
```bash
brew install flyctl
```

2. Login to Fly:
```bash
fly auth login
```

3. Create a new app (first time only):
```bash
fly apps create your-app-name
```

4. Set required secrets:
```bash
fly secrets set \
  TELEGRAM_BOT_TOKEN="your_bot_token" \
  BASE_URL="your-app.fly.dev" \
  GAME_URL="https://your-app.fly.dev/game" \
  GAME_SHORT_NAME="your_game_short_name" \
  -a your-app-name
```

5. Deploy:
```bash
fly deploy
```

6. Verify deployment:
```bash
fly status
fly logs
```

## Game Deployment to Vercel

### Prerequisites
1. [ ] Vercel CLI installed (`npm i -g vercel`)
2. [ ] Vercel account with access to the project
3. [ ] Domain access for game.soltap.ai
4. [ ] Existing www.soltap.ai deployment untouched

### Game Deployment Steps

1. Create new Vercel project (first time only):
```bash
# Navigate to game directory
cd game

# Create new project
vercel init
```

2. Configure project settings:
- Project name: soltap-game
- Framework preset: Vite
- Build Command: `npm run build -w game`
- Output Directory: `game/dist`

3. Set environment variables:
```bash
vercel env add VITE_API_URL
vercel env add VITE_GAME_SHORT_NAME
# Add other required environment variables
```

4. Configure domain:
```bash
# Add game subdomain
vercel domains add game.soltap.ai
```

5. Deploy:
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

6. Verify deployment:
- Check game.soltap.ai accessibility
- Test game functionality
- Verify Telegram bot integration

### Important Notes for Game Deployment

1. **Separate Projects**
   - Keep game deployment separate from www.soltap.ai
   - Use different project IDs and configurations
   - Maintain separate environment variables

2. **Domain Configuration**
   - game.soltap.ai requires separate DNS configuration
   - CNAME record pointing to cname.vercel-dns.com
   - SSL certificate will be handled by Vercel

3. **Build Configuration**
   - Ensure all dependencies are properly installed
   - Verify build output in game/dist directory
   - Check for any build-time environment variables

4. **Post-Deployment Verification**
   - Test game functionality
   - Verify API connections
   - Check Telegram bot integration
   - Monitor error logs

### Game Deployment Checklist

1. [ ] Vercel CLI installed and configured
2. [ ] New project created for game only
3. [ ] Environment variables set
4. [ ] Domain configured correctly
5. [ ] Build succeeds locally
6. [ ] Dependencies properly installed
7. [ ] API endpoints configured
8. [ ] SSL/HTTPS properly configured
9. [ ] Telegram bot updated with new game URL
10. [ ] Monitoring and logging set up

## Important Configuration Notes

### ES Modules
The project uses ES modules. Key configurations:
- `"type": "module"` in package.json
- Proper `.js` extensions in imports
- TypeScript configured for ES modules

### Docker Configuration
The Dockerfile is configured to:
1. Use Node.js 18 Alpine
2. Install dependencies
3. Build TypeScript code
4. Run the server with environment validation

## API Endpoints

- `/api/webhook`: Telegram webhook endpoint
- `/game`: Serves the game

## Common Issues and Solutions

### 1. Wrong Game Short Name
- Error: "wrong game short name specified"
- Solution: 
  - Check game short name with @BotFather
  - Use EXACTLY the same name (case-sensitive)
  - Update both .env and fly.io secrets

### 2. Port Conflicts
If deployment fails with port conflicts:
```bash
# Force destroy existing machine
fly machine destroy --force MACHINE_ID
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
- Webhook URL must match https://BASE_URL/api/webhook

### 4. Environment Variables
If the bot fails to start, check:
- All required environment variables are set
- Values are correct and properly formatted
- No trailing spaces in values

## Deployment Checklist

1. [ ] All environment variables set
2. [ ] Built and tested locally
3. [ ] Webhook URL configured correctly
4. [ ] Proper memory and CPU allocation
5. [ ] Game short name matches exactly
6. [ ] SSL/HTTPS properly configured
