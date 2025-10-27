const request = require('supertest');

// Ensure central setup runs first (injects DB mock and Clerk stubs)
require('../setupTests');

// Mock Clerk locally as well to be explicit for this test file
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  requireAuth: () => (req, res, next) => next(),
}));

const db = global.__DB_MOCK__ || require('../../config/database');

// Build a minimal Express app and mount only the products router to avoid
// side-effects from the full server initialization.
const express = require('express');
const productsRouter = require('../../routes/products');
const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

beforeEach(() => { if (db && db.query && db.query.mockReset) db.query.mockReset(); });
afterAll(async () => { if (db.end) await db.end(); jest.restoreAllMocks(); });

describe('PRODUCTS endpoints', () => {
  test('GET /api/products -> 200 and returns array', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ product_id: 1, name: 'P1' }] });
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/products/:id -> 400 on invalid id', async () => {
    const res = await request(app).get('/api/products/xyz');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('GET /api/products/:id -> 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app).get('/api/products/1');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('success', false);
  });
});
