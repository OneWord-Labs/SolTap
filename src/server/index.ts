
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_CONFIG } from '../game/config/telegram';
import { ViteDevServer } from 'vite';

const app = express();
const port = 3000;
const bot = new TelegramBot(TELEGRAM_CONFIG.botToken, { polling: true });

app.use(express.json());
app.use(express.static('dist'));

// Telegram bot handlers
bot.onText(/\/start/, (msg) => {
  bot.sendGame(msg.chat.id, TELEGRAM_CONFIG.gameShortName);
});

bot.on('callback_query', (query) => {
  if (query.game_short_name === TELEGRAM_CONFIG.gameShortName) {
    bot.answerCallbackQuery(query.id, {
      url: `${TELEGRAM_CONFIG.webAppUrl}?userId=${query.from.id}`,
    });
  }
});

// Score update endpoint
app.post('/api/score', async (req, res) => {
  const { userId, score } = req.body;
  try {
    await bot.setGameScore(userId, score, { force: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ error: 'Failed to update score' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
