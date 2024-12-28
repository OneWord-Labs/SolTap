
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_CONFIG } from '../game/config/telegram';

const app = express();
const port = 3000;
const bot = new TelegramBot(TELEGRAM_CONFIG.botToken, { polling: true });

bot.on('error', (error) => {
  console.error('Telegram Bot Error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Telegram Polling Error:', error);
});

bot.getMe().then((botInfo) => {
  console.log('Bot connected successfully:', botInfo.username);
}).catch((error) => {
  console.error('Failed to connect bot:', error);
});

app.use(express.json());
app.use(express.static('dist'));

// API health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const botInfo = await bot.getMe();
    res.json({
      status: 'ok',
      game: TELEGRAM_CONFIG.gameShortName,
      telegram: {
        connected: true,
        botInfo,
        gameUrl: TELEGRAM_CONFIG.webAppUrl,
        botToken: TELEGRAM_CONFIG.botToken ? '✓ Set' : '✗ Missing'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Telegram',
      error: error.message
    });
  }
});

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
