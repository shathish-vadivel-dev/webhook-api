const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Webhook Post
app.post('/webhook', async (req, res) => {
  let parsedBody;

  try {
    // First, use the body if JSON was already parsed
    if (typeof req.body === 'object' && !(req.body instanceof Buffer)) {
      parsedBody = req.body;
    } else {
      // Otherwise, try converting raw buffer to string and parse if it's JSON
      const bodyStr = req.body.toString('utf8').trim();
      try {
        parsedBody = JSON.parse(bodyStr);
      } catch (e) {
        // Not valid JSON — fallback to plain text string as payload
        parsedBody = { raw: bodyStr };
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


// Get webhook data by document_file_uuid
app.get('/webhook/:docId', async (req, res) => {
  const docId = req.params.docId;

  if (!docId) {
    return res.status(400).json({ error: 'document_file_uuid is required' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM webhook
       WHERE payload->'body'->'payload'->>'document_file_uuid' = $1
       ORDER BY created_date DESC`,
      [docId]
    );

    res.status(200).json({ count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error('❌ Query error:', error.stack);
    res.status(500).json({ error: 'Failed to fetch records', detail: error.message });
  }
});


// Bind to 0.0.0.0 for Railway public access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
