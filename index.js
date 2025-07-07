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

// Test DB connection once on startup
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('DB Connected:', res.rows[0]);
  } catch (err) {
    console.error('DB Connection Error:', err);
    process.exit(1); // Exit if DB connection fails
  }
})();

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
    res.status(500).send({ error: 'Failed to save webhook', payload });
  }
});

app.get('/', (req, res) => {
  res.send('🌐 Webhook API is running');
});

// Bind to 0.0.0.0 for Railway public access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
