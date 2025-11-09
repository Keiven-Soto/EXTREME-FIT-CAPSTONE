const request = require('supertest');

// Mock Clerk so protected routes don't block tests
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  requireAuth: () => (req, res, next) => next(),
}));
const db = global.__DB_MOCK__ || require('../../config/database');
const app = require('../../server');

afterEach(() => db.query.mockReset());
afterAll(async () => { if (db.end) await db.end(); jest.restoreAllMocks(); });

describe('WISHLIST endpoints', () => {
  test('GET /api/wishlist/:user_id -> 200 and returns data', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ wishlist_id: 1, product_id: 10 }] });
    const res = await request(app).get('/api/wishlist/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/wishlist/:user_id -> 400 on invalid id', async () => {
    const res = await request(app).get('/api/wishlist/abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/wishlist/add -> 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app).post('/api/wishlist/add').send({ userId: 1, productId: 5 });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('success', false);
  });
});
