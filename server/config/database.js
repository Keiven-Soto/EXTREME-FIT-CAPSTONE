const { Pool } = require('pg');

// If running tests in unit mode (no integration), prefer a global mock
// if the test harness injected one. Otherwise provide a clear stub that
// fails early instead of attempting to connect to a real DB.
if (process.env.NODE_ENV === 'test' && process.env.RUN_INTEGRATION !== 'true') {
  if (global && global.__DB_MOCK__) {
    module.exports = global.__DB_MOCK__;
  } else {
    module.exports = {
      query: async () => {
        throw new Error(
          'No DB mock present. Run tests with RUN_INTEGRATION=true to use a real DB, or ensure test setup injects global.__DB_MOCK__ before requiring the database module.'
        );
      },
    };
  }
} else {
  // Production / Development (non-test) path: create a real Pool but do
  // not call connect() at import time — defer connections until queries run.
  const pool = new Pool(
    process.env.DATABASE_URL
      ? {
          // Production: Use Neon connection string
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false,
          },
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
}