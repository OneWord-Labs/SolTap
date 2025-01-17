import 'dotenv/config.js';
import express, { Request, Response, Router, RequestHandler } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { TelegramService } from '../services/telegram/telegram.service.js';
import { Logger } from '../utils/Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '../../');

const app = express();
const router = Router();
const logger = new Logger('Server');

// Validate required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  logger.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Middleware
app.use((req: Request, res: Response, next: Function) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

// Initialize services
const telegramService = TelegramService.getInstance();

// Telegram webhook endpoint
router.post('/webhook', (async (req: Request, res: Response) => {
  logger.info('Webhook request received');
  logger.info('Method:', req.method);
  logger.info('Headers:', req.headers);
  logger.info('Body:', req.body);
  
  try {
    await telegramService.handleUpdate(req.body);
    logger.info('Webhook processed successfully');
    res.json({ ok: true });
  } catch (error: any) {
    logger.error('Webhook handling failed:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      message: error.message 
    });
  }
}) as RequestHandler);

// Health check endpoints
router.get('/health', (_req: Request, res: Response) => {
  logger.info('Health check request received');
  res.status(200).send('OK');
});

router.get('/health/details', (async (_req: Request, res: Response) => {
  try {
    const health = await telegramService.getHealth();
    res.json({
      ...health,
      timestamp: new Date().toISOString(),
      service: 'soltap-game',
      environment: process.env.NODE_ENV
    });
  } catch (error: any) {
    logger.error('Detailed health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Telegram',
      error: error.message,
      timestamp: new Date().toISOString(),
      service: 'soltap-game',
      environment: process.env.NODE_ENV
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

// Mount API routes
app.use('/api', router);

// Start server
const PORT = parseInt(process.env.PORT || '8080', 10);
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running at http://0.0.0.0:${PORT}`);
  logger.info('Environment:', process.env.NODE_ENV || 'production');
  logger.info('Static files directory:', DIST_DIR);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
