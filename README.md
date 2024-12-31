# SolTap Telegram Bot

A Telegram bot for the SolTap game, built with Node.js, TypeScript, and deployed on fly.io.

## Project Structure

```
.
├── bot/              # Telegram bot server
├── shared/           # Shared code between bot and game
└── fly.toml          # Fly.io configuration
```

## Environment Variables

Create a `.env` file in the `bot` directory with the following variables:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
BASE_URL=http://localhost:8080 # For local development
GAME_SHORT_NAME=soltap
NODE_ENV=development
```

For production on fly.io, these variables are set using `fly secrets`.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Build the shared package:
```bash
npm run build -w shared
```

3. Build and run the bot:
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
fly launch
```

4. Set required secrets:
```bash
fly secrets set TELEGRAM_BOT_TOKEN=your_bot_token
fly secrets set BASE_URL=https://your-app.fly.dev
fly secrets set GAME_SHORT_NAME=soltap
fly secrets set NODE_ENV=production
```

5. Deploy:
```bash
fly deploy
```

## Important Configuration Notes

### ES Modules
The project uses ES modules. Key configurations:
- `"type": "module"` in package.json
- Proper `.js` extensions in imports
- TypeScript configured for ES modules

### Fly.io Configuration
Key settings in `fly.toml`:
```toml
[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false  # Prevents machine from stopping
  auto_start_machines = true
  min_machines_running = 1
```

### Docker Configuration
The Dockerfile is configured to:
1. Use Node.js 18 Alpine
2. Install dependencies
3. Build TypeScript code
4. Run the server

## API Endpoints

- `/api/webhook`: Telegram webhook endpoint
- `/game`: Serves the game

## Troubleshooting

1. **Bot Not Responding**
   - Check machine status: `fly status`
   - View logs: `fly logs`
   - Restart machine: `fly machine restart [machine-id]`

2. **Webhook Issues**
   - Verify webhook URL matches BASE_URL
   - Check Telegram webhook info
   - Ensure SSL certificate is valid

3. **ES Module Errors**
   - Verify import statements use `.js` extension
   - Check tsconfig.json module settings
   - Ensure package.json has `"type": "module"`

## Deployment Checklist

1. [ ] All environment variables set
2. [ ] Built and tested locally
3. [ ] Webhook URL configured correctly
4. [ ] auto_stop_machines disabled
5. [ ] SSL certificate valid
6. [ ] Logs showing no errors

## License

MIT
