const express = require('express');
const cors = require('cors');
const { clerkMiddleware, requireAuth } = require('@clerk/express');
require('dotenv').config(); 

const routes = require('./routes/routes');
const addressRoutes = require('./routes/addresses');
const productRoute = require('./routes/products');
const ordersRoute = require('./routes/orders');
const categoriesRoute = require('./routes/categories');
const cartItemsRoute = require('./routes/cart_items');
const wishlistRoute = require('./routes/wishlist');

const app = express();
const PORT = process.env.PORT || 5001;

// ⚠️ Webhooks MUST be before express.json()
app.use('/api/webhooks', require('./routes/webhooks'));

app.use(cors());
app.use(express.json());

// 🔐 Add Clerk middleware GLOBALLY (verifies JWT but doesn't require it)
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

// Root route (public)
app.get('/', (req, res) => {
  res.json({ message: 'ExtremeFit API is running!' });
});

// Test database connection (public)
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

// Public routes (no auth required) - Register FIRST
console.log('📍 Registering /api/products (public)');
app.use('/api/products', productRoute);

console.log('📍 Registering /api/categories (public)');
app.use('/api/categories', categoriesRoute);

// 🔐 Protected routes (requireAuth() applied inside route files)
console.log('📍 Registering /api/addresses (protected)');
app.use('/api/addresses', addressRoutes);

console.log('📍 Registering /api/orders (protected)');
app.use('/api/orders', ordersRoute);

console.log('📍 Registering /api/cart (protected)');
app.use('/api', cartItemsRoute);

console.log('📍 Registering /api/wishlist (protected)');
app.use('/api/wishlist', wishlistRoute);

// General user routes (has both public and protected endpoints)
// Must be LAST to avoid conflicts with more specific routes
console.log('📍 Registering /api general routes');
app.use('/api', routes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ExtremeFit API running on http://localhost:${PORT}`);
    console.log(`Test DB connection: http://localhost:${PORT}/api/test-db`);
  });
}

module.exports = app;