const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        // Production: Use Neon connection string
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        // Development: Use local PostgreSQL
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5433,
        database: process.env.DB_NAME || 'extremefit_dev',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'extremefit123',
      }
);

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL:', err.stack);
  } else {
    const dbInfo = process.env.DATABASE_URL ? 'Neon (Production)' : 'Local PostgreSQL';
    console.log(`✅ Connected to ${dbInfo} database`);
    release();
  }
});

module.exports = pool;