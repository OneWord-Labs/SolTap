
import { TELEGRAM_CONFIG } from '../config/telegram';
import { Logger } from '../../utils/Logger';

export class TelegramService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TelegramService');
  }

  async updateScore(userId: number, score: number) {
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, score }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update score');
      }
    } catch (error) {
      this.logger.error('Error updating score:', error);
    }
  }
}
