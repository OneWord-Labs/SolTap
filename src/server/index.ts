
import express from 'express';
import { TelegramService } from '../services/telegram/telegram.service';
import { Logger } from '../utils/Logger';
import { createServer as createViteServer } from 'vite';

const app = express();
const port = 3000;
const logger = new Logger('Server');
const telegramService = new TelegramService();

async function startServer() {
  app.use(express.json());

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  // API routes before any static file handling
  app.get('/api/health', async (req, res) => {
    try {
      const health = await telegramService.getHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to connect to Telegram',
        error: error.message
      });
    }
  });

  app.post('/api/score', async (req, res) => {
    const { userId, score } = req.body;
    try {
      await telegramService.updateScore(userId, score);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update score' });
    }
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.listen(port, '0.0.0.0', () => {
    logger.info(`Server running on port ${port}`);
  });
}

startServer().catch((err) => {
  logger.error('Error starting server:', err);
});
