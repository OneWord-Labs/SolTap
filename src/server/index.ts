import 'dotenv/config';
import express, { Request, Response, Router, RequestHandler } from 'express';
import cors from 'cors';
import { TelegramService } from '../services/telegram/telegram.service.js';
import { Logger } from '../utils/Logger.js';

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
    return res.status(400).json({ 
      error: 'Invalid request body. Required: userId (number) and score (number)' 
    });
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
const server = app.listen(port, '0.0.0.0', () => {
  logger.info(`API Server running at http://0.0.0.0:${port}`);
  logger.info('Environment:', process.env.NODE_ENV);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
