const TelegramBot = require('node-telegram-bot-api');

// Initialize bot with the token
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const gameShortName = 'solsays';
const webAppUrl = process.env.BASE_URL || 'https://play.soltap.xyz';

// Export the handler function
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received webhook request:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Handle /start command
    if (req.body?.message?.text === '/start') {
      console.log('Received /start command from chat:', req.body.message.chat.id);
      try {
        await bot.sendGame(req.body.message.chat.id, gameShortName);
        console.log('Successfully sent game to chat:', req.body.message.chat.id);
      } catch (error) {
        console.error('Error sending game:', error);
        await bot.sendMessage(req.body.message.chat.id, 'Sorry, there was an error starting the game.');
      }
    }

    // Handle callback query
    if (req.body?.callback_query?.game_short_name === gameShortName) {
      console.log('Received game callback query from user:', req.body.callback_query.from.id);
      try {
        await bot.answerCallbackQuery(req.body.callback_query.id, {
          url: `${webAppUrl}?userId=${req.body.callback_query.from.id}`,
        });
        console.log('Successfully answered callback query for user:', req.body.callback_query.from.id);
      } catch (error) {
        console.error('Error answering callback query:', error);
      }
    }

    // Always respond with 200 OK for Telegram
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    // Still send 200 OK to Telegram
    return res.status(200).json({ ok: true });
  }
}; 