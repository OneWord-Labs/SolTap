import { z } from 'zod';

const telegramConfigSchema = z.object({
  botToken: z.string().min(1),
  gameShortName: z.string().min(1),
  webAppUrl: z.string(),
  botUrl: z.string(),
});

export const TELEGRAM_CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  gameShortName: 'solsays',
  webAppUrl: process.env.BASE_URL || 'https://play.soltap.xyz',
  botUrl: 'https://t.me/SolSays_bot',
};

try {
  telegramConfigSchema.parse(TELEGRAM_CONFIG);
} catch (error) {
  console.error('Invalid Telegram configuration:', error);
  process.exit(1);
}

export type TelegramConfig = z.infer<typeof telegramConfigSchema>;
