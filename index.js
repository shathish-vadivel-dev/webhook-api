const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON normally
app.use(bodyParser.json());

// Parse non-JSON as raw (e.g., text/xml/html/etc.)
app.use(bodyParser.raw({
  type: (req) => {
    const contentType = req.headers['content-type'] || '';
    return !contentType.includes('application/json');
  },
  limit: '50mb'
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.post('/webhook', async (req, res) => {
  let parsedBody;

  try {
    // If already parsed (JSON), use it
    if (typeof req.body === 'object' && !(req.body instanceof Buffer)) {
      parsedBody = req.body;
    } else {
      const rawString = req.body.toString('utf8').trim();
      try {
        parsedBody = JSON.parse(rawString);
      } catch {
        parsedBody = { raw: rawString };
      }
    }

    const payload = {
      headers: req.headers,
      body: parsedBody
    };

    const createdAtUTC = new Date().toISOString();

    await pool.query(
      'INSERT INTO webhook (payload, created_date) VALUES ($1, $2)',
      [payload, createdAtUTC]
    );

    console.log('✅ Webhook saved at', createdAtUTC);
    res.status(200).json({ message: 'Webhook saved!' });
  } catch (error) {
    console.error('❌ Save failed:', error);
    res.status(500).json({ error: 'Failed to save webhook' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
