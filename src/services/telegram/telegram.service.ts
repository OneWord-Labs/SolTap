import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_CONFIG } from '../../config/telegram.config.js';
import { Logger } from '../../utils/Logger.js';

interface TelegramError extends Error {
  code?: string;
  response?: {
    statusCode?: number;
  };
}

const logger = new Logger('TelegramService');

/**
 * Singleton service for handling Telegram bot operations
 */
export class TelegramService {
  private static instance: TelegramService;
  private bot: TelegramBot;
  private logger: Logger;

  private constructor() {
    this.logger = logger;

    // In production, use webhook. In development, use polling.
    const options: TelegramBot.ConstructorOptions = {
      webHook: process.env.NODE_ENV === 'production' ? {
        port: Number(process.env.PORT || 3000)
      } : undefined,
      polling: process.env.NODE_ENV !== 'production'
    };

    this.bot = new TelegramBot(TELEGRAM_CONFIG.botToken, options);

    // Set up webhook only in production
    if (process.env.NODE_ENV === 'production') {
      // Try to get the base URL from various sources
      const baseUrl = process.env.BASE_URL || TELEGRAM_CONFIG.webAppUrl || 'https://sol-tap-v2-stable-production.up.railway.app';
      const webhookUrl = `${baseUrl}/api/webhook`;
      this.bot.setWebHook(webhookUrl).then(() => {
        this.logger.info('Webhook set successfully:', webhookUrl);
      }).catch(error => {
        this.logger.error('Failed to set webhook:', error);
      });
    } else {
      // In development, ensure webhook is deleted
      this.bot.deleteWebHook().then(() => {
        this.logger.info('Webhook deleted for development mode');
      }).catch(error => {
        this.logger.error('Failed to delete webhook:', error);
      });
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.bot.on('error', (error) => {
      this.logger.error('Telegram Bot Error:', error);
    });

    this.bot.on('polling_error', (error: TelegramError) => {
      if (error.code === 'ETELEGRAM' && error.response?.statusCode === 409) {
        this.logger.warn('Polling conflict detected, stopping current polling...');
        this.bot.stopPolling()
          .then(() => {
            this.logger.info('Polling stopped, waiting before retry...');
            setTimeout(() => {
              this.logger.info('Retrying bot initialization...');
              this.bot.startPolling()
                .catch(err => this.logger.error('Error restarting polling:', err));
            }, 5000);
          })
          .catch(err => this.logger.error('Error stopping polling:', err));
      } else {
        this.logger.error('Telegram Polling Error:', error);
      }
    });

    this.setupCommands();
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  private setupCommands() {
    this.bot.onText(/\/start/, async (msg) => {
      try {
        await this.bot.sendGame(msg.chat.id, TELEGRAM_CONFIG.gameShortName);
        this.logger.info('Sent game to chat:', msg.chat.id);
      } catch (error) {
        this.logger.error('Error sending game:', error);
        await this.bot.sendMessage(msg.chat.id, 'Sorry, there was an error starting the game.');
      }
    });

    this.bot.on('callback_query', (query) => {
      if (query.game_short_name === TELEGRAM_CONFIG.gameShortName) {
        this.bot.answerCallbackQuery(query.id, {
          url: `${TELEGRAM_CONFIG.webAppUrl}?userId=${query.from.id}`,
        });
      }
    });
  }

  async updateScore(userId: number, score: number): Promise<void> {
    try {
      await this.bot.setGameScore(userId, score, { force: true });
    } catch (error) {
      this.logger.error('Error updating score:', error);
      throw error;
    }
  }

  async getHealth(): Promise<any> {
    try {
      const botInfo = await this.bot.getMe();
      return {
        status: 'ok',
        game: TELEGRAM_CONFIG.gameShortName,
        telegram: {
          connected: true,
          botInfo,
          gameUrl: TELEGRAM_CONFIG.webAppUrl,
          botToken: TELEGRAM_CONFIG.botToken ? '✓ Set' : '✗ Missing',
          mode: process.env.NODE_ENV === 'production' ? 'webhook' : 'polling',
          port: process.env.PORT ? Number(process.env.PORT) : 3001,
          baseUrl: process.env.BASE_URL || TELEGRAM_CONFIG.webAppUrl || 'https://sol-tap-v2-stable-production.up.railway.app'
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async handleUpdate(update: TelegramBot.Update): Promise<void> {
    try {
      this.logger.info('Processing webhook update:', update);
      await this.bot.processUpdate(update);
    } catch (error) {
      this.logger.error('Error processing webhook update:', error);
      throw error;
    }
  }
}
