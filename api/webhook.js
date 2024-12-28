import { TelegramService } from '../src/services/telegram/telegram.service.js';
import { Logger } from '../src/utils/Logger.js';

const logger = new Logger('WebhookAPI');
const telegramService = TelegramService.getInstance();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.info('Received webhook request');
    logger.info('Request headers:', req.headers);
    logger.info('Request body:', JSON.stringify(req.body, null, 2));
    
    if (!req.body) {
      logger.error('No request body received');
      return res.status(400).json({ error: 'No request body' });
    }

    await telegramService.handleUpdate(req.body);
    logger.info('Successfully processed webhook update');
    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error('Error handling webhook update:', error);
    logger.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
} 