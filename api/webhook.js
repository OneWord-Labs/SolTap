const TelegramBot = require('node-telegram-bot-api');

// Initialize bot with the token
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const gameShortName = 'solsays';
const webAppUrl = process.env.BASE_URL || 'https://play.soltap.xyz';

// Export the handler function
module.exports = async (request, response) => {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received webhook request:', {
      headers: request.headers,
      body: request.body
    });

    // Handle /start command
    if (request.body?.message?.text === '/start') {
      console.log('Received /start command from chat:', request.body.message.chat.id);
      try {
        await bot.sendGame(request.body.message.chat.id, gameShortName);
        console.log('Successfully sent game to chat:', request.body.message.chat.id);
      } catch (error) {
        console.error('Error sending game:', error);
        await bot.sendMessage(request.body.message.chat.id, 'Sorry, there was an error starting the game.');
      }
    }

    // Handle callback query
    if (request.body?.callback_query?.game_short_name === gameShortName) {
      console.log('Received game callback query from user:', request.body.callback_query.from.id);
      try {
        await bot.answerCallbackQuery(request.body.callback_query.id, {
          url: `${webAppUrl}?userId=${request.body.callback_query.from.id}`,
        });
        console.log('Successfully answered callback query for user:', request.body.callback_query.from.id);
      } catch (error) {
        console.error('Error answering callback query:', error);
      }
    }

    // Always respond with 200 OK
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    // Still send 200 OK to Telegram
    return response.status(200).json({ ok: true });
  }
}; 