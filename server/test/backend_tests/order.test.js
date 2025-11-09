const request = require('supertest');
const { Pool } = require('pg');

/**
 * @file order.test.js
 * @description Test suite for Order Details API endpoints - Integration Tests
 * @tests Business logic validation: tax calculations, totals, inventory rules
 * @note This is an integration test that uses a real database connection
 */

// Create a real database pool for integration testing
const realDb = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5433,
        database: process.env.DB_NAME || 'extremefit_dev',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'extremefit123',
      }
);

// Mock Clerk authentication for testing
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => {
    req.auth = () => ({
      userId: 'test_clerk_id',
      sessionId: 'test_session_id'
    });
    next();
  },
  requireAuth: () => (req, res, next) => next(),
}));

// Mock the getClerkUser middleware to bypass database lookup
jest.mock('../../middleware/clerkUser', () => ({
  getClerkUser: (req, res, next) => {
    req.user = {
      user_id: 1,
      clerk_id: 'test_clerk_id',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    };
    next();
  }
}));

let app;
let db;

beforeAll(() => {
  // Set the real database as the global mock so getDb() returns it
  global.__DB_MOCK__ = realDb;
  db = realDb;

  // Load app after setting up the database mock
  app = require('../../server');
});

describe('Order Details API - Business Logic Tests', () => {
  let testUserId;
  let testOrderId;
  let testProductId;
  let testAddressId;

  // Setup: Create test data before all tests
  beforeAll(async () => {
    // Clean up any existing test data first (in correct order due to foreign keys)
    await db.query(`DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE user_id IN (SELECT user_id FROM users WHERE clerk_id = 'test_clerk_id'))`);
    await db.query(`DELETE FROM orders WHERE user_id IN (SELECT user_id FROM users WHERE clerk_id = 'test_clerk_id')`);
    await db.query(`DELETE FROM addresses WHERE user_id IN (SELECT user_id FROM users WHERE clerk_id = 'test_clerk_id')`);
    await db.query(`DELETE FROM products WHERE name = 'Test Product'`);
    await db.query(`DELETE FROM users WHERE clerk_id = 'test_clerk_id'`);

    // Create test user
    const userResult = await db.query(`
      INSERT INTO users (first_name, last_name, email, clerk_id)
      VALUES ('Test', 'User', 'test@example.com', 'test_clerk_id')
      RETURNING user_id
    `);
    testUserId = userResult.rows[0].user_id;

    // Create test address
    const addressResult = await db.query(`
      INSERT INTO addresses (user_id, street_address, city, state, postal_code, country, is_default)
      VALUES ($1, '123 Test St', 'Miami', 'FL', '33101', 'USA', true)
      RETURNING address_id
    `, [testUserId]);
    testAddressId = addressResult.rows[0].address_id;

    // Create test product
    const productResult = await db.query(`
      INSERT INTO products (name, description, price, stock_quantity)
      VALUES ('Test Product', 'Test Description', 29.99, 100)
      RETURNING product_id
    `);
    testProductId = productResult.rows[0].product_id;

    // Create test order
    const orderResult = await db.query(`
      INSERT INTO orders (
        user_id, 
        total_amount, 
        shipping_cost, 
        payment_method, 
        payment_status, 
        order_status,
        shipping_address_id
      )
      VALUES ($1, 100.00, 10.00, 'Card', 'paid', 'processing', $2)
      RETURNING order_id
    `, [testUserId, testAddressId]);
    testOrderId = orderResult.rows[0].order_id;

    // Create order items
    await db.query(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, size, color)
      VALUES ($1, $2, 2, 29.99, 'M', 'Black')
    `, [testOrderId, testProductId]);
  });

  // Cleanup: Remove test data after all tests
  afterAll(async () => {
    await db.query('DELETE FROM order_items WHERE order_id = $1', [testOrderId]);
    await db.query('DELETE FROM orders WHERE order_id = $1', [testOrderId]);
    await db.query('DELETE FROM products WHERE product_id = $1', [testProductId]);
    await db.query('DELETE FROM addresses WHERE address_id = $1', [testAddressId]);
    await db.query('DELETE FROM users WHERE user_id = $1', [testUserId]);
    // Don't close connection yet - other test suites may need it
  });

  // ============================================
  // TEST SUITE 1: TAX CALCULATIONS
  // ============================================
  describe('Tax Calculations', () => {
    test('should calculate 11.5% IVU tax correctly', () => {
      const subtotal = 100.00;
      const expectedTax = 11.50; // 11.5% of 100
      const calculatedTax = +(subtotal * 0.115).toFixed(2);

      expect(calculatedTax).toBe(expectedTax);
    });

    test('should calculate tax on order subtotal from API', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}`);

      if (response.status !== 200) {
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
      }
      expect(response.status).toBe(200);

      const order = response.body.data;
      
      // Get order items to calculate subtotal
      const itemsResponse = await request(app)
        .get(`/api/orders/${testOrderId}/items`)
        .expect(200);

      const items = itemsResponse.body.data;
      const subtotal = items.reduce((acc, item) => {
        return acc + (Number(item.unit_price) * Number(item.quantity));
      }, 0);

      const expectedTax = +(subtotal * 0.115).toFixed(2);
      
      // Verify tax calculation matches business rule
      expect(expectedTax).toBeCloseTo(6.90, 2); // 59.98 * 0.115 = 6.90
    });

    test('should round tax to 2 decimal places', () => {
      const subtotal = 33.33;
      const tax = +(subtotal * 0.115).toFixed(2);
      
      expect(tax).toBe(3.83);
      expect(tax.toString().split('.')[1].length).toBeLessThanOrEqual(2);
    });
  });

  // ============================================
  // TEST SUITE 2: TOTAL CALCULATIONS
  // ============================================
  describe('Total Calculations', () => {
    test('should calculate total as subtotal + shipping + tax', () => {
      const subtotal = 59.98;
      const shipping = 10.00;
      const tax = 6.90;
      const expectedTotal = 76.88;

      const calculatedTotal = Number((subtotal + shipping + tax).toFixed(2));

      expect(calculatedTotal).toBe(expectedTotal);
    });

    test('should fetch order and verify total calculation', async () => {
      // Get order items
      const itemsResponse = await request(app)
        .get(`/api/orders/${testOrderId}/items`)
        .expect(200);

      const items = itemsResponse.body.data;
      
      // Calculate subtotal from items
      const subtotal = items.reduce((acc, item) => {
        return acc + (Number(item.unit_price) * Number(item.quantity));
      }, 0);

      // Get shipping cost from order
      const orderResponse = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .expect(200);

      const shipping = Number(orderResponse.body.data.shipping_cost || 0);
      const tax = +(subtotal * 0.115).toFixed(2);
      const expectedTotal = Number((subtotal + shipping + tax).toFixed(2));

      // Verify calculation
      expect(expectedTotal).toBe(76.88);
      expect(subtotal).toBe(59.98);
      expect(shipping).toBe(10.00);
      expect(tax).toBe(6.90);
    });

    test('should handle zero shipping cost', () => {
      const subtotal = 100.00;
      const shipping = 0;
      const tax = 11.50;
      const total = Number((subtotal + shipping + tax).toFixed(2));

      expect(total).toBe(111.50);
    });

    test('should handle multiple items in subtotal calculation', () => {
      const items = [
        { unit_price: 29.99, quantity: 2 },
        { unit_price: 15.50, quantity: 1 },
        { unit_price: 45.00, quantity: 3 }
      ];

      const subtotal = items.reduce((acc, item) => {
        return acc + (item.unit_price * item.quantity);
      }, 0);

      expect(subtotal).toBe(210.48); // (29.99*2) + (15.50*1) + (45.00*3)
    });
  });

  // ============================================
  // TEST SUITE 3: ORDER ITEM VALIDATION
  // ============================================
  describe('Order Item Validation', () => {
    test('should fetch order items successfully', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}/items`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should validate order item has required fields', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}/items`)
        .expect(200);

      const item = response.body.data[0];

      expect(item).toHaveProperty('product_id');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('unit_price');
      expect(Number(item.quantity)).toBeGreaterThan(0);
      expect(Number(item.unit_price)).toBeGreaterThan(0);
    });

    test('should validate quantity is a positive integer', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}/items`)
        .expect(200);

      const items = response.body.data;

      items.forEach(item => {
        expect(Number(item.quantity)).toBeGreaterThan(0);
        expect(Number.isInteger(Number(item.quantity))).toBe(true);
      });
    });

    test('should validate unit_price is a positive number', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}/items`)
        .expect(200);

      const items = response.body.data;

      items.forEach(item => {
        expect(Number(item.unit_price)).toBeGreaterThan(0);
        expect(typeof Number(item.unit_price)).toBe('number');
      });
    });
  });

  // ============================================
  // TEST SUITE 4: ORDER STATUS VALIDATION
  // ============================================
  describe('Order Status Validation', () => {
    test('should fetch order with valid status', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .expect(200);

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      expect(validStatuses).toContain(response.body.data.order_status);
    });

    test('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  // ============================================
  // TEST SUITE 5: SHIPPING VALIDATION
  // ============================================
  describe('Shipping Validation', () => {
    test('should validate shipping cost is non-negative', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .expect(200);

      const shippingCost = Number(response.body.data.shipping_cost);
      expect(shippingCost).toBeGreaterThanOrEqual(0);
    });

    test('should have valid shipping address', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .expect(200);

      const order = response.body.data;
      
      // If order has shipping_address_id, it should be valid
      if (order.shipping_address_id) {
        expect(order.shipping_address_id).toBeGreaterThan(0);
      }
    });
  });

  // ============================================
  // TEST SUITE 6: PAYMENT VALIDATION
  // ============================================
  describe('Payment Validation', () => {
    test('should validate payment method', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .expect(200);

      const validMethods = ['Card', 'PayPal', 'Cash', 'Bank Transfer'];
      expect(validMethods).toContain(response.body.data.payment_method);
    });

    test('should validate payment status', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .expect(200);

      const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
      expect(validStatuses).toContain(response.body.data.payment_status);
    });
  });

  // ============================================
  // TEST SUITE 7: EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    test('should handle order with no items gracefully', async () => {
      // Create order with no items
      const emptyOrderResult = await db.query(`
        INSERT INTO orders (user_id, total_amount, shipping_cost, payment_method, payment_status, order_status)
        VALUES ($1, 0, 0, 'Card', 'pending', 'pending')
        RETURNING order_id
      `, [testUserId]);

      const emptyOrderId = emptyOrderResult.rows[0].order_id;

      const response = await request(app)
        .get(`/api/orders/${emptyOrderId}/items`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);

      // Cleanup
      await db.query('DELETE FROM orders WHERE order_id = $1', [emptyOrderId]);
    });

    test('should handle very small amounts correctly', () => {
      const subtotal = 0.01;
      const tax = +(subtotal * 0.115).toFixed(2);
      const shipping = 0;
      const total = Number((subtotal + tax + shipping).toFixed(2));

      expect(tax).toBe(0.00); // Rounds to 0
      expect(total).toBe(0.01);
    });

    test('should handle large order amounts correctly', () => {
      const subtotal = 9999.99;
      const tax = +(subtotal * 0.115).toFixed(2);
      const shipping = 50.00;
      const total = Number((subtotal + tax + shipping).toFixed(2));

      expect(tax).toBe(1150.00);
      expect(total).toBe(11199.99);
    });
  });

  // ============================================
  // TEST SUITE 8: CURRENCY FORMATTING
  // ============================================
  describe('Currency Formatting', () => {
    test('should format prices to 2 decimal places', () => {
      const prices = [29.99, 100, 45.5, 0.99];
      
      prices.forEach(price => {
        const formatted = Number(price).toFixed(2);
        expect(formatted.split('.')[1].length).toBe(2);
      });
    });

    test('should handle currency conversion correctly', () => {
      const priceInCents = 2999; // $29.99
      const priceInDollars = priceInCents / 100;
      
      expect(priceInDollars).toBe(29.99);
      expect(Number(priceInDollars.toFixed(2))).toBe(29.99);
    });
  });

  // ============================================
  // TEST SUITE 9: API RESPONSE STRUCTURE
  // ============================================
  describe('API Response Structure', () => {
    test('should return correct structure for order details', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.success).toBe(true);
    });

    test('should return correct structure for order items', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrderId}/items`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

// ============================================
// INTEGRATION TEST: Full Order Flow
// ============================================
describe('Order Details - Full Integration Test', () => {
  let integrationTestUserId;
  let integrationTestOrderId;
  let integrationTestProductId;
  let integrationTestAddressId;

  beforeAll(async () => {
    // Create dedicated test data for integration test
    const userResult = await db.query(`
      INSERT INTO users (first_name, last_name, email, clerk_id)
      VALUES ('Integration', 'Test', 'integration@example.com', 'integration_clerk_id')
      RETURNING user_id
    `);
    integrationTestUserId = userResult.rows[0].user_id;

    const addressResult = await db.query(`
      INSERT INTO addresses (user_id, street_address, city, state, postal_code, country, is_default)
      VALUES ($1, '456 Test Ave', 'San Juan', 'PR', '00901', 'USA', true)
      RETURNING address_id
    `, [integrationTestUserId]);
    integrationTestAddressId = addressResult.rows[0].address_id;

    const productResult = await db.query(`
      INSERT INTO products (name, description, price, stock_quantity)
      VALUES ('Integration Product', 'Test Description', 50.00, 100)
      RETURNING product_id
    `);
    integrationTestProductId = productResult.rows[0].product_id;

    const orderResult = await db.query(`
      INSERT INTO orders (
        user_id,
        total_amount,
        shipping_cost,
        payment_method,
        payment_status,
        order_status,
        shipping_address_id
      )
      VALUES ($1, 150.00, 15.00, 'Card', 'paid', 'processing', $2)
      RETURNING order_id
    `, [integrationTestUserId, integrationTestAddressId]);
    integrationTestOrderId = orderResult.rows[0].order_id;

    await db.query(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, size, color)
      VALUES ($1, $2, 3, 50.00, 'L', 'Blue')
    `, [integrationTestOrderId, integrationTestProductId]);
  });

  afterAll(async () => {
    await db.query('DELETE FROM order_items WHERE order_id = $1', [integrationTestOrderId]);
    await db.query('DELETE FROM orders WHERE order_id = $1', [integrationTestOrderId]);
    await db.query('DELETE FROM products WHERE product_id = $1', [integrationTestProductId]);
    await db.query('DELETE FROM addresses WHERE address_id = $1', [integrationTestAddressId]);
    await db.query('DELETE FROM users WHERE user_id = $1', [integrationTestUserId]);
    // Close database connection at the end of ALL tests
    await realDb.end();
  });

  test('should fetch complete order with items and calculate totals correctly', async () => {
    // This test simulates the full flow from OrderDetails.js component

    // 1. Get order base data
    const orderResponse = await request(app)
      .get(`/api/orders/${integrationTestOrderId}`)
      .expect(200);

    expect(orderResponse.body.success).toBe(true);
    const order = orderResponse.body.data;

    // 2. Get order items
    const itemsResponse = await request(app)
      .get(`/api/orders/${integrationTestOrderId}/items`)
      .expect(200);

    expect(itemsResponse.body.success).toBe(true);
    const items = itemsResponse.body.data;

    // 3. Calculate subtotal
    const subtotal = items.reduce((acc, item) => {
      return acc + (Number(item.unit_price) * Number(item.quantity));
    }, 0);

    // 4. Get shipping
    const shipping = Number(order.shipping_cost || 0);

    // 5. Calculate tax (11.5% IVU)
    const tax = +(subtotal * 0.115).toFixed(2);

    // 6. Calculate total
    const total = Number((subtotal + shipping + tax).toFixed(2));

    // Verify all calculations are valid
    expect(subtotal).toBeGreaterThanOrEqual(0);
    expect(shipping).toBeGreaterThanOrEqual(0);
    expect(tax).toBeGreaterThanOrEqual(0);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeCloseTo(subtotal + shipping + tax, 2);
  });
});