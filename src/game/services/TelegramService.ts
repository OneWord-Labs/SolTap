
import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_CONFIG } from '../config/telegram';
import { Logger } from '../../utils/Logger';

export class TelegramService {
  private bot: TelegramBot;
  private logger: Logger;

  constructor() {
    this.bot = new TelegramBot(TELEGRAM_CONFIG.botToken, { polling: true });
    this.logger = new Logger('TelegramService');
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.onText(/\/start/, (msg) => {
      this.bot.sendGame(msg.chat.id, TELEGRAM_CONFIG.gameShortName);
    });

    this.bot.on('callback_query', (query) => {
      if (query.game_short_name === TELEGRAM_CONFIG.gameShortName) {
        this.bot.answerCallbackQuery(query.id, {
          url: `${TELEGRAM_CONFIG.webAppUrl}?userId=${query.from.id}`,
        });
      }
    });
  }

  async updateScore(userId: number, score: number) {
    try {
      await this.bot.setGameScore(userId, score, {
        force: true,
      });
    } catch (error) {
      this.logger.error('Error updating score:', error);
    }
  }
}
