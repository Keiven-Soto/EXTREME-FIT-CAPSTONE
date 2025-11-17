const request = require('supertest');

// Mock Clerk so protected routes don't block tests
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  requireAuth: () => (req, res, next) => next(),
}));
let db;
let app;

beforeAll(() => {
  db = global.__DB_MOCK__ || require('../../config/database');
  // Require app after mocks are injected
  app = require('../../server');
});

afterEach(() => { if (db && db.query && db.query.mockReset) db.query.mockReset(); });
afterAll(async () => { if (db && db.end) await db.end(); jest.restoreAllMocks(); });

describe('CATEGORIES endpoints', () => {
  test('GET /api/categories -> 200 and returns data', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ category_id: 1, name: 'Cat' }] });
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    // Accept either an array of categories or a single category object
    expect(
      Array.isArray(res.body.data) || (res.body.data && typeof res.body.data === 'object')
    ).toBe(true);
  });

  test('GET /api/categories/:gender -> 200 and returns data', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ category_id: 2, name: 'Men' }] });
    const res = await request(app).get('/api/categories/male');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/categories/:gender -> 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app).get('/api/categories/male');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('success', false);
  });
});
