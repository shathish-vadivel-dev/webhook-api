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

// Webhook route
// Webhook POST
app.post('/webhook', async (req, res) => {
  const payload = {
    headers: req.headers,
    body: req.body
  };

  try {
    await pool.query('INSERT INTO webhook (payload) VALUES ($1)', [payload]);
    console.log('✅ Webhook saved.');
    res.status(200).send({ message: 'Webhook saved!' });
  } catch (error) {
    console.error('❌ DB Error:', error);
    res.status(500).send({ error: 'Failed to save webhook', payload });
  }
});

// GET route to check DB connection live
app.get('/', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.send('✅ DB connected successfully');
  } catch (error) {
    res.status(500).send('❌ DB connection failed');
  }
});

// Bind to 0.0.0.0 for Railway public access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
