import { TelegramService } from '../src/services/telegram/telegram.service.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, score } = req.body;
  
  if (!userId || typeof score !== 'number') {
    return res.status(400).json({ 
      error: 'Invalid request body. Required: userId (number) and score (number)' 
    });
  }

  try {
    const telegramService = TelegramService.getInstance();
    await telegramService.updateScore(userId, score);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update score',
      message: error.message 
    });
  }
} 