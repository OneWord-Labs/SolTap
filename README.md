# Sol Tap V2

A Telegram mini-game built with TypeScript and Vite.

## Deployment Status
[![Vercel Deployment](https://img.shields.io/badge/vercel-deployed-success)](https://soltap.vercel.app)

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. For local testing with Telegram Bot:
```bash
npm run dev:ngrok
```

## Environment Variables

Required environment variables:
- `TELEGRAM_BOT_TOKEN`: Your Telegram Bot token
- `BASE_URL`: Local development URL
- `PRODUCTION_URL`: Production deployment URL

## Fly.io Environment Setup

### Backend Environments

The backend service is deployed to two separate Fly.io applications:

- Production: `soltap-bot` (soltap-bot.fly.dev)
- Staging: `soltap-bot-preview` (soltap-bot-preview.fly.dev)

### Deployment Configuration

Each environment has its own configuration in `bot/fly.toml`:

```toml
# Production Configuration
app = "soltap-bot"
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

### Environment Variables

Sensitive information is managed through Fly.io secrets:

```bash
# Set secrets for production
fly secrets set TELEGRAM_BOT_TOKEN="your-token" --app soltap-bot

# Set secrets for staging
fly secrets set TELEGRAM_BOT_TOKEN="your-token" --app soltap-bot-preview
```

### Deployment Commands

Deploy to production:
```bash
cd bot && fly deploy --app soltap-bot
```

Deploy to staging:
```bash
cd bot && fly deploy --app soltap-bot-preview
```

### Monitoring and Logs

View production logs:
```bash
fly logs --app soltap-bot
```

View staging logs:
```bash
fly logs --app soltap-bot-preview
```

Check application status:
```bash
fly status --app soltap-bot        # Production
fly status --app soltap-bot-preview # Staging
```

### CI/CD Integration

The GitHub Actions workflows automatically deploy:
- Production: When merging to `main` branch
- Staging: When creating pull requests or pushing to `preview` branch

### Best Practices

1. Always test changes in the staging environment first
2. Use separate environment variables for each environment
3. Monitor application logs after deployments
4. Keep the `fly.toml` configuration in version control
5. Use descriptive commit messages for deployment changes
