import 'dotenv/config';
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
const port = process.env.PORT || 3000;
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
  res.status(200).send('OK');
});

router.get('/health/details', (async (_req: Request, res: Response) => {
  try {
    const health = await telegramService.getHealth();
    res.json(health);
  } catch (error: any) {
    logger.error('Detailed health check failed:', error);
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

// Mount API routes
app.use('/api', router);

// Serve static files
app.use(express.static(path.join(DIST_DIR)));

// Handle client-side routing
app.get('*', (_req: Request, res: Response) => {
  logger.info('Serving index.html for path:', _req.path);
  res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
    if (err) {
      logger.error('Error sending file:', err);
      res.status(500).send('Error loading page');
    }
  });
});

// Start server
const server = app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
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
