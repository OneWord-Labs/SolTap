
import { z } from 'zod';

const telegramConfigSchema = z.object({
  botToken: z.string().min(1),
  gameShortName: z.string().min(1),
  webAppUrl: z.string().url(),
});

export const TELEGRAM_CONFIG = {
  botToken: process.env.SOLTAP_TELEGRAM_BOT_TOKEN || '',
  gameShortName: 'soltap',
  webAppUrl: process.env.WEBAPP_URL || '',
};

try {
  telegramConfigSchema.parse(TELEGRAM_CONFIG);
} catch (error) {
  console.error('Invalid Telegram configuration:', error);
  process.exit(1);
}

export type TelegramConfig = z.infer<typeof telegramConfigSchema>;
