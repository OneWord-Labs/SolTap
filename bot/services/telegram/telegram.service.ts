import TelegramBot from 'node-telegram-bot-api';
import { Logger } from '../../utils/Logger.js';

export class TelegramService {
  private static instance: TelegramService;
  private bot: TelegramBot;
  private logger: Logger;
  private gameShortName: string;

  private constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }

    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error('BASE_URL is not set');
    }

    const gameShortName = process.env.GAME_SHORT_NAME;
    if (!gameShortName) {
      throw new Error('GAME_SHORT_NAME is not set');
    }

    this.gameShortName = gameShortName;
    this.logger = new Logger('TelegramService');
    
    // In production, don't start a server - we'll use Express for webhooks
    if (process.env.NODE_ENV === 'production') {
      this.bot = new TelegramBot(token, { webHook: false });
      
      const webhookUrl = `${baseUrl}/api/webhook`;
      this.logger.info(`Setting webhook URL to: ${webhookUrl}`);
      
      this.bot.setWebHook(webhookUrl).then(() => {
        this.logger.info('Webhook set successfully');
      }).catch((error) => {
        this.logger.error('Failed to set webhook:', error);
        process.exit(1);
      });
    } else {
      this.bot = new TelegramBot(token, { polling: true });
      this.logger.info('Bot started in polling mode (development)');
    }

    this.setupHandlers();
  }

  static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  private setupHandlers() {
    this.bot.onText(/\/start/, async (msg) => {
      try {
        this.logger.info('Received /start command from user:', msg.from?.id);
        const chatId = msg.chat.id;
        
        await this.bot.sendMessage(chatId, 'Welcome to Sol Tap! 🎮\nTap to start playing:');
        const gameMessage = await this.bot.sendGame(chatId, this.gameShortName);
        
        this.logger.info('Game sent successfully:', {
          messageId: gameMessage.message_id,
          chatId: gameMessage.chat.id,
          gameShortName: this.gameShortName
        });
      } catch (error) {
        this.logger.error('Failed to handle /start command:', error);
        try {
          await this.bot.sendMessage(msg.chat.id, 'Sorry, something went wrong. Please try again later.');
        } catch (sendError) {
          this.logger.error('Failed to send error message:', sendError);
        }
      }
    });

    this.bot.on('callback_query', async (query) => {
      try {
        if (!query.game_short_name) return;
        
        const gameUrl = process.env.GAME_URL;
        if (!gameUrl) {
          throw new Error('GAME_URL is not set');
        }

        this.logger.info('Answering callback query with game URL:', gameUrl);
        await this.bot.answerCallbackQuery(query.id, {
          url: gameUrl
        });
        
        this.logger.info('Callback query answered successfully');
      } catch (error) {
        this.logger.error('Failed to handle callback query:', error);
        try {
          await this.bot.answerCallbackQuery(query.id, {
            text: 'Sorry, something went wrong. Please try again.',
            show_alert: true
          });
        } catch (answerError) {
          this.logger.error('Failed to send error callback answer:', answerError);
        }
      }
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
      const webhookInfo = await this.bot.getWebHookInfo();
      
      return {
        status: 'ok',
        game: this.gameShortName,
        telegram: {
          connected: true,
          botInfo,
          webhookInfo,
          gameUrl: process.env.GAME_URL || 'http://localhost:3000',
          botToken: '✓ Set',
          mode: process.env.NODE_ENV === 'production' ? 'webhook' : 'polling',
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