
/**
 * Telegram Game Configuration
 * Required environment variables:
 * - TELEGRAM_BOT_TOKEN: Bot token from @BotFather
 * - WEBAPP_URL: The URL where the game is hosted
 */
export const TELEGRAM_CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  gameShortName: 'soltap',  // Must match the short name set in @BotFather
  webAppUrl: process.env.WEBAPP_URL || '',
};
