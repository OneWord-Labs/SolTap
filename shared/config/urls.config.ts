export const URLS = {
  development: process.env.NGROK_URL || process.env.BASE_URL || 'http://localhost:3000',
  production: process.env.PRODUCTION_URL || 'https://your-production-domain.com',
};

export const getBaseUrl = () => {
  if (process.env.NGROK_URL) {
    return process.env.NGROK_URL;
  }
  return process.env.NODE_ENV === 'production' ? URLS.production : URLS.development;
};
