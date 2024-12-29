import TelegramBot from 'node-telegram-bot-api';
import { Logger } from '../../utils/Logger.js';

export class TelegramService {
  private static instance: TelegramService;
  private bot: TelegramBot;
  private logger: Logger;
  private gameShortName = 'solsays';

  private constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }

    this.logger = new Logger('TelegramService');
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
  }

  static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  private setupHandlers() {
    this.bot.onText(/\/start/, (msg) => {
      this.logger.info('Received /start command');
      const chatId = msg.chat.id;
      this.bot.sendGame(chatId, this.gameShortName).catch((error) => {
        this.logger.error('Failed to send game:', error);
      });
    });

    this.bot.on('callback_query', (query) => {
      if (!query.game_short_name) return;
      
      const gameUrl = process.env.GAME_URL || 'http://localhost:3000';
      this.bot.answerCallbackQuery(query.id, {
        url: gameUrl,
      }).catch((error) => {
        this.logger.error('Failed to answer callback query:', error);
      });
    });
  }

  async handleUpdate(update: any) {
    try {
      await this.bot.processUpdate(update);
      return true;
    } catch (error) {
      this.logger.error('Failed to process update:', error);
      throw error;
    }
  }

  async updateScore(userId: number, score: number) {
    try {
      await this.bot.setGameScore(userId, score, {
        force: true
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to update score:', error);
      throw error;
    }
  }

  async getHealth() {
    try {
      const botInfo = await this.bot.getMe();
      return {
        status: 'ok',
        game: this.gameShortName,
        telegram: {
          connected: true,
          botInfo,
          gameUrl: process.env.GAME_URL || 'http://localhost:3000',
          botToken: '✓ Set',
          mode: 'polling',
          port: process.env.PORT || 3001,
          baseUrl: process.env.BASE_URL || 'http://localhost:3001'
        }
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw error;
    }
  }
} 