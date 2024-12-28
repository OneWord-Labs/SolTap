import https from 'https';

const setupWebhook = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const baseUrl = process.env.BASE_URL;

  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    process.exit(1);
  }

  if (!baseUrl) {
    console.error('BASE_URL is not set');
    process.exit(1);
  }

  const webhookUrl = `${baseUrl}/api`;
  const telegramUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`;

  console.log(`Setting webhook to: ${webhookUrl}`);

  try {
    const response = await new Promise((resolve, reject) => {
      https.get(telegramUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data) }));
      }).on('error', reject);
    });

    if (response.statusCode === 200 && response.data.ok) {
      console.log('Webhook set successfully:', response.data);
      process.exit(0);
    } else {
      console.error('Failed to set webhook:', response.data);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error setting webhook:', error);
    process.exit(1);
  }
};

setupWebhook(); 