const request = require('supertest');

// Mock Clerk so protected routes don't block tests
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  requireAuth: () => (req, res, next) => next(),
}));
let db;
let app;

beforeAll(() => {
  // Acquire the mock after Jest's setupFilesAfterEnv has run
  db = global.__DB_MOCK__ || require('../../config/database');
  // Require app after mocks are injected so middleware and routes pick up the mocked modules
  app = require('../../server');
});

afterEach(() => { if (db && db.query && db.query.mockReset) db.query.mockReset(); });
afterAll(async () => { if (db && db.end) await db.end(); jest.restoreAllMocks(); });

describe('ORDERS endpoints', () => {
  test('GET /api/orders -> 200 and returns array', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ order_id: 1, user_id: 1 }] });
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/orders/user/:user_id -> 200 and returns data', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ order_id: 2 }] });
    const res = await request(app).get('/api/orders/user/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/orders/:id -> 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app).get('/api/orders/1');
    expect(res.status).toBe(500);
  });
});
