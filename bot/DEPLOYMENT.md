# Bot Deployment Guide

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file in `/bot` directory:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token
   NODE_ENV=development
   PORT=3001
   GAME_URL=https://app.soltap.xyz
   BASE_URL=http://localhost:3001
   ```

3. Start development server:
   ```bash
   npm run dev -w bot
   ```

## Production Deployment (Fly.io)

### Prerequisites
1. Install Fly.io CLI
2. Login to Fly.io: `flyctl auth login`
3. Ensure you have the following files in `/bot`:
   - `Dockerfile`
   - `fly.toml`

### Environment Variables
Set the following secrets in Fly.io:
```bash
flyctl secrets set TELEGRAM_BOT_TOKEN=your_bot_token
flyctl secrets set NODE_ENV=production
flyctl secrets set GAME_URL=https://app.soltap.xyz
```

### Deployment Steps
1. Build and deploy:
   ```bash
   flyctl deploy
   ```

2. Check deployment status:
   ```bash
   flyctl status
   ```

3. View logs:
   ```bash
   flyctl logs
   ```

### Monitoring
- Health check endpoint: `https://your-app.fly.dev/api/health`
- Detailed health: `https://your-app.fly.dev/api/health/details`

### Troubleshooting
1. Check logs: `flyctl logs`
2. SSH into instance: `flyctl ssh console`
3. Restart app: `flyctl restart` 