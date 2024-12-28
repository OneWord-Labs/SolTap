import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_CONFIG } from '../../config/telegram.config.js';
import { Logger } from '../../utils/Logger.js';

interface TelegramError extends Error {
  code?: string;
  response?: {
    statusCode?: number;
  };
}

export class TelegramService {
  private bot: TelegramBot;
  private logger: Logger;
  private static instance: TelegramService;

  private constructor() {
    this.logger = new Logger('TelegramService');
    const options: TelegramBot.ConstructorOptions = {
      polling: process.env.NODE_ENV !== 'production',
      webHook: process.env.NODE_ENV === 'production' ? {
        port: Number(process.env.PORT) || 3001
      } : undefined
    };

    this.bot = new TelegramBot(TELEGRAM_CONFIG.botToken, options);
    this.initializeBot();
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  private async initializeBot() {
    try {
      if (process.env.NODE_ENV === 'production') {
        // In production, use webhooks
        const webhookUrl = `${TELEGRAM_CONFIG.webAppUrl}/api`;
        await this.bot.setWebHook(webhookUrl);
        this.logger.info('Webhook set to:', webhookUrl);
      } else {
        // In development, use polling
        await this.bot.deleteWebHook();
        this.logger.info('Webhook deleted, using polling');
      }
      
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
    } catch (error) {
      this.logger.error('Error initializing bot:', error);
      throw error;
    }
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

  async handleUpdate(update: TelegramBot.Update): Promise<void> {
    try {
      this.logger.info('Processing update:', JSON.stringify(update, null, 2));
      
      // Handle /start command
      if (update.message?.text === '/start') {
        this.logger.info('Received /start command from chat:', update.message.chat.id);
        try {
          this.logger.info('Attempting to send game with shortName:', TELEGRAM_CONFIG.gameShortName);
          await this.bot.sendGame(update.message.chat.id, TELEGRAM_CONFIG.gameShortName);
          this.logger.info('Successfully sent game to chat:', update.message.chat.id);
        } catch (error: any) {
          this.logger.error('Failed to send game:', error);
          this.logger.error('Error stack:', error.stack);
          await this.bot.sendMessage(update.message.chat.id, 'Sorry, there was an error starting the game. Error: ' + error.message);
        }
      } else {
        this.logger.info('Update did not contain /start command:', update.message?.text);
      }
      
      // Handle callback query (when user clicks the game)
      if (update.callback_query?.game_short_name === TELEGRAM_CONFIG.gameShortName) {
        this.logger.info('Received game callback query from user:', update.callback_query.from.id);
        const gameUrl = `${TELEGRAM_CONFIG.webAppUrl}?userId=${update.callback_query.from.id}`;
        this.logger.info('Answering callback query with URL:', gameUrl);
        await this.bot.answerCallbackQuery(update.callback_query.id, {
          url: gameUrl,
        });
        this.logger.info('Successfully answered callback query for user:', update.callback_query.from.id);
      }
    } catch (error: any) {
      this.logger.error('Error handling update:', error);
      this.logger.error('Error stack:', error.stack);
      throw error;
    }
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
          botToken: TELEGRAM_CONFIG.botToken ? '✓ Set' : '✗ Missing'
        }
      };
    } catch (error) {
      throw error;
    }
  }
}
