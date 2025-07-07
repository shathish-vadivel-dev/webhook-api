require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.post('/webhook', async (req, res) => {
  const payload = {
    headers: req.headers,
    body: req.body
  };

  try {
    await pool.query('INSERT INTO webhook_logs (payload) VALUES ($1)', [payload]);
    console.log('✅ Webhook data saved!');
    res.status(200).json({ message: 'Webhook received and saved.' });
  } catch (error) {
    console.error('❌ DB error:', error);
    res.status(500).json({ error: 'Failed to save webhook data' });
  }
});

app.get('/', (req, res) => {
  res.send('🌐 Webhook API is running');
});

// Bind to 0.0.0.0 for public access on Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
