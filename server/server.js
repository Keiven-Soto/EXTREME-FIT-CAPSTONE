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

// 🔐 Protected routes - Apply requireAuth() here
console.log('📍 Registering /api/addresses');
app.use('/api/addresses', requireAuth(), addressRoutes);

console.log('📍 Registering /api/orders');
app.use('/api/orders', requireAuth(), ordersRoute);

// Public routes (no auth required)
console.log('📍 Registering /api/products (public)');
app.use('/api/products', productRoute);
app.use('/api/', ordersRoute);
app.use('/api/categories', categoriesRoute);
app.use('/api', cartItemsRoute);
app.use('/api/wishlist', wishlistRoute);

// 🔐 Important: /api routes must be AFTER specific routes to avoid conflicts
console.log('📍 Registering /api (generic)');
app.use('/api', requireAuth(), routes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ExtremeFit API running on http://localhost:${PORT}`);
    console.log(`Test DB connection: http://localhost:${PORT}/api/test-db`);
  });
}

module.exports = app;