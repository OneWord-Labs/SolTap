const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

// Initialize Express
const app = express();

// Parse incoming JSON
app.use(express.json());

// Retrieve the Telegram Bot Token from environment variables
const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error('Please provide the BOT_TOKEN as an environment variable.');
}

// Create a new Telegram Bot instance in "webhook" mode
const bot = new TelegramBot(token, { polling: false });

// Game configuration
const gameShortName = 'testgame';
const gameUrl = 'https://telegram-game-base.vercel.app/game'; // We'll create this page next

// Set up an endpoint that Telegram will call
app.post('/api/bot', (req, res) => {
  // Process the incoming update
  bot.processUpdate(req.body);
  // Respond with 200 OK
  res.sendStatus(200);
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to the game! Type /help to see available commands or /play to start playing.');
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
Available commands:
/start - Start the bot
/help - Show this help message
/play - Start the game
  `;
  bot.sendMessage(chatId, helpMessage);
});

// Handle /play command
bot.onText(/\/play/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    await bot.sendGame(chatId, gameShortName);
  } catch (error) {
    console.error('Error sending game:', error);
    bot.sendMessage(chatId, 'Sorry, there was an error starting the game. Please try again later.');
  }
});

// Handle callback_query for the game
bot.on('callback_query', async (callbackQuery) => {
  if (callbackQuery.game_short_name !== gameShortName) {
    return;
  }

  try {
    await bot.answerCallbackQuery(callbackQuery.id, {
      url: gameUrl,
    });
  } catch (error) {
    console.error('Error handling callback query:', error);
    bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Sorry, there was an error loading the game. Please try again.',
      show_alert: true
    });
  }
});

// Handle other messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text.startsWith('/')) {
    bot.sendMessage(chatId, `You said: ${msg.text}\nType /play to start the game!`);
  }
});

// Export the Express app
module.exports = app; 