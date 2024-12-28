import { TelegramService } from '../src/services/telegram/telegram.service.js';

export default async function handler(req, res) {
  try {
    const telegramService = TelegramService.getInstance();
    const health = await telegramService.getHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Telegram',
      error: error.message
    });
  }
} 