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
const port = Number(process.env.PORT) || 3001;
const logger = new Logger('Server');

// Validate required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  logger.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Initialize services
const telegramService = TelegramService.getInstance();

// Middleware
app.use(cors());
app.use(express.json());

// Interface definitions
interface ScoreUpdateRequest {
  userId: number;
  score: number;
}

// Telegram webhook endpoint (must be before other routes)
app.post('/api', async (req, res) => {
  try {
    logger.info('Received webhook request at /api');
    logger.info('Request headers:', req.headers);
    logger.info('Request body:', JSON.stringify(req.body, null, 2));
    
    if (!req.body) {
      logger.error('No request body received');
      res.sendStatus(400);
      return;
    }

    await telegramService.handleUpdate(req.body);
    logger.info('Successfully processed webhook update');
    res.sendStatus(200);
  } catch (error: any) {
    logger.error('Error handling webhook update:', error);
    logger.error('Error stack:', error.stack);
    res.sendStatus(500);
  }
});

// API Router setup
const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', async (_req: Request, res: Response) => {
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
});

// Score update endpoint
apiRouter.post('/score', async (req: Request<{}, {}, ScoreUpdateRequest>, res: Response) => {
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
});

// Mount API routes after webhook
app.use('/api', apiRouter);

// Serve static files
app.use(express.static(path.join(DIST_DIR)));

// Handle client-side routing
app.get('*', (_req: Request, res: Response) => {
  // Check if it's a direct browser access without userId parameter
  if (!_req.query.userId) {
    logger.info('Direct browser access detected, redirecting to Telegram bot');
    return res.redirect(302, TELEGRAM_CONFIG.botUrl);
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
