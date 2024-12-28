
import express from 'express';
import { TelegramService } from '../services/telegram/telegram.service';

const app = express();
const port = 3000;
const telegramService = new TelegramService();

app.use(express.json());
app.use(express.static('dist'));

app.get('/api/health', async (req, res) => {
  try {
    const health = await telegramService.getHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Telegram',
      error: error.message
    });
  }
});

app.post('/api/score', async (req, res) => {
  const { userId, score } = req.body;
  try {
    await telegramService.updateScore(userId, score);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update score' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
