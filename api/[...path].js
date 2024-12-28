import app from '../dist/server/index.js';

export default async function handler(req, res) {
  // Forward the request to the Express app
  return new Promise((resolve, reject) => {
    app(req, res);
    res.on('finish', resolve);
    res.on('error', reject);
  });
} 