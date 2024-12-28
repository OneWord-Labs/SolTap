module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received webhook request:', {
      headers: req.headers,
      body: req.body
    });

    // Send immediate 200 OK response
    res.status(200).json({ ok: true });

    // Process the update asynchronously
    if (req.body?.message?.text === '/start') {
      console.log('Received /start command');
      // Handle /start command
    }
  } catch (error) {
    console.error('Error in webhook handler:', error);
    // Already sent 200 OK, just log the error
  }
}; 