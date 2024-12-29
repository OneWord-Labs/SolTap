import TelegramBot from 'node-telegram-bot-api';
import * as logger from 'firebase-functions/logger';

/**
 * Service for handling Telegram bot operations
 */
export class TelegramService {
  private bot: TelegramBot;

  constructor(botToken: string) {
    if (!botToken) {
      throw new Error('Telegram bot token is required');
    }

    this.bot = new TelegramBot(botToken);
  }

  async setupWebhook(baseUrl: string) {
    if (!baseUrl) {
      throw new Error('Base URL is required for webhook setup');
    }

    const webhookUrl = `${baseUrl}/telegramWebhook`;
    try {
      await this.bot.setWebHook(webhookUrl);
      logger.info('Webhook set successfully:', webhookUrl);
    } catch (error) {
      logger.error('Failed to set webhook:', error);
      throw error;
    }
  }

  async setupCommands(gameShortName: string) {
    if (!gameShortName) {
      throw new Error('Game short name is required');
    }

    await this.bot.setMyCommands([
      { command: '/start', description: 'Start the game' }
    ]);
  }

  async handleStart(msg: TelegramBot.Message, gameShortName: string) {
    try {
      await this.bot.sendGame(msg.chat.id, gameShortName);
      logger.info('Sent game to chat:', msg.chat.id);
    } catch (error) {
      logger.error('Error sending game:', error);
      await this.bot.sendMessage(msg.chat.id, 'Sorry, there was an error starting the game.');
    }
  }

  async handleCallbackQuery(query: TelegramBot.CallbackQuery, gameShortName: string, webAppUrl: string) {
    if (query.game_short_name === gameShortName) {
      this.bot.answerCallbackQuery(query.id, {
        url: `${webAppUrl}?userId=${query.from.id}`,
      });
    }
  }

  async updateScore(userId: number, score: number): Promise<void> {
    try {
      await this.bot.setGameScore(userId, score, { force: true });
    } catch (error) {
      logger.error('Error updating score:', error);
      throw error;
    }
  }

  async handleUpdate(update: TelegramBot.Update, gameShortName: string, webAppUrl: string): Promise<void> {
    try {
      logger.info('Processing webhook update:', update);
      
      if (update.message && update.message.text === '/start') {
        await this.handleStart(update.message, gameShortName);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query, gameShortName, webAppUrl);
      }
      
    } catch (error) {
      logger.error('Error processing webhook update:', error);
      throw error;
    }
  }
} 