
import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_CONFIG } from '../../config/telegram.config';
import { Logger } from '../../utils/Logger';

export class TelegramService {
  private bot: TelegramBot;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TelegramService');
    this.bot = new TelegramBot(TELEGRAM_CONFIG.botToken, { polling: true });
    this.initializeBot();
  }

  private initializeBot() {
    this.bot.on('error', (error) => {
      this.logger.error('Telegram Bot Error:', error);
    });

    this.bot.on('polling_error', (error) => {
      this.logger.error('Telegram Polling Error:', error);
    });

    this.setupCommands();
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
          botToken: TELEGRAM_CONFIG.botToken ? '✓ Set' : '✗ Missing'
        }
      };
    } catch (error) {
      throw error;
    }
  }
}
