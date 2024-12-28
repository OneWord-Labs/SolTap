import 'dotenv/config';
import express, { Request, Response, Router, RequestHandler, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { TelegramService } from '../services/telegram/telegram.service.js';
import { TELEGRAM_CONFIG } from '../config/telegram.config.js';
import { Logger } from '../utils/Logger.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '../../');

const app = express();
const router = Router();
const port = Number(process.env.PORT) || 3001;
const logger = new Logger('Server');

// Validate required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  logger.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const telegramService = TelegramService.getInstance();

// Telegram webhook authentication middleware
const authenticateTelegramWebhook = ((req: Request, res: Response, next: NextFunction) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.error('TELEGRAM_BOT_TOKEN not set');
    return res.sendStatus(401);
  }

  // Log the full request for debugging
  logger.info('Webhook request headers:', req.headers);
  logger.info('Webhook request body:', req.body);

  // Allow health check endpoint without verification
  if (req.path === '/health') {
    return next();
  }

  next();
}) as RequestHandler;

// Apply Telegram webhook authentication to all API routes
router.use(authenticateTelegramWebhook);

// Health check endpoint
router.get('/health', (async (_req: Request, res: Response) => {
  try {
    const health = await telegramService.getHealth();
    res.json(health);
  } catch (error: any) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Telegram',
      error: error.message
    });
  }
}) as RequestHandler);

interface ScoreUpdateRequest {
  userId: number;
  score: number;
}

// Score update endpoint
router.post('/score', (async (req: Request<{}, {}, ScoreUpdateRequest>, res: Response) => {
  const { userId, score } = req.body;
  
  if (!userId || typeof score !== 'number') {
    res.status(400).json({ 
      error: 'Invalid request body. Required: userId (number) and score (number)' 
    });
    return;
  }

  try {
    await telegramService.updateScore(userId, score);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Score update failed:', error);
    res.status(500).json({ 
      error: 'Failed to update score',
      message: error.message 
    });
  }
}) as RequestHandler);

// Telegram webhook endpoint
router.post('/', (async (req: Request, res: Response) => {
  try {
    logger.info('Received webhook update:', req.body);
    await telegramService.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (error: any) {
    logger.error('Error handling webhook update:', error);
    res.sendStatus(500);
  }
}) as RequestHandler);

// Mount API routes
app.use('/api', router);

// Serve static files
app.use(express.static(path.join(DIST_DIR)));

// Handle client-side routing
app.get('*', (_req: Request, res: Response) => {
  // Check if it's a direct browser access without userId parameter
  if (!_req.query.userId) {
    logger.info('Direct browser access detected, redirecting to Telegram bot');
    return res.redirect(TELEGRAM_CONFIG.botUrl);
  }

  logger.info('Serving index.html for path:', _req.path);
  res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
    if (err) {
      logger.error('Error sending file:', err);
      res.status(500).send('Error loading page');
    }
  });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  logger.info(`API Server running at http://0.0.0.0:${port}`);
  logger.info('Environment:', process.env.NODE_ENV);
  logger.info('Static files directory:', DIST_DIR);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
