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
  ssl: {
    rejectUnauthorized: false,
  },
});

// Webhook route
app.post('/webhook', async (req, res) => {
  const payload = {
    headers: req.headers,
    body: req.body
  };

  try {
    await pool.query('INSERT INTO webhook_logs (payload) VALUES ($1)', [payload]);
    console.log('✅ Webhook saved.');
    res.status(200).send({ message: 'Webhook saved!' });
  } catch (error) {
    console.error('❌ DB Error:', error);
    res.status(500).send({ error: 'Failed to save webhook' });
  }
});

app.get('/', (req, res) => {
  res.send('🌐 Webhook API is running');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
