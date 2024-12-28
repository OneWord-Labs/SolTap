
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_CONFIG } from '../game/config/telegram';

const app = express();
const port = 3000;

const bot = new TelegramBot(TELEGRAM_CONFIG.botToken, { polling: true });

app.use(express.static('dist'));

// Handle game callbacks
bot.on('callback_query', (query) => {
  if (query.game_short_name === TELEGRAM_CONFIG.gameShortName) {
    const gameUrl = `${TELEGRAM_CONFIG.webAppUrl}?userId=${query.from.id}`;
    bot.answerCallbackQuery(query.id, { url: gameUrl });
  }
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendGame(msg.chat.id, TELEGRAM_CONFIG.gameShortName);
});

// Handle score updates
app.post('/score', express.json(), async (req, res) => {
  const { userId, score } = req.body;
  try {
    await bot.setGameScore(userId, score, {
      force: true,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update score' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
