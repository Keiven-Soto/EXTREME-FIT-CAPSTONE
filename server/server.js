const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const routes = require('./routes/routes');

const app = express();
const PORT = process.env.PORT || 5001; // ← Usar variable de entorno

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'ExtremeFit API is running!' });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const db = require('./config/database');
    const result = await db.query('SELECT NOW() as current_time, version()');
    res.json({ 
      status: 'Connected ✅', 
      database: process.env.DB_NAME || 'extremefit_dev',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error ❌', 
      message: error.message 
    });
  }
});

app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`ExtremeFit API running on http://localhost:${PORT}`);
  console.log(`Test DB connection: http://localhost:${PORT}/api/test-db`);
});