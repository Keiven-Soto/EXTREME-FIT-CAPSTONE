const request = require('supertest');

// Ensure the central setup runs before we require the app so the DB mock is
// injected into require.cache and shared with controllers.
require('../setupTests');

// Inject mock DB into handlers before the app/routes are required so route
// handlers use the same mock instance.
const handlers = require('../../controllers/handlers');
const db = global.__DB_MOCK__ || require('../../config/database');
if (handlers.setDb) handlers.setDb(db);
// Ensure the mock is clean before any request hits the app (avoid leftover
// calls during module initialization consuming mockResolvedValueOnce entries).
if (db && db.query && db.query.mockReset) db.query.mockReset();

// Mock Clerk so protected routes don't block tests
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  requireAuth: () => (req, res, next) => next(),
}));
// Instead of loading the full `server.js` (which mounts many routes and can
// introduce side-effects), create a minimal Express app and mount only the
// users router. This keeps the test focused and avoids unrelated DB calls.
const express = require('express');
const usersRouter = require('../../routes/routes');
const app = express();
app.use(express.json());
app.use('/api', usersRouter);

afterEach(() => {
  db.query.mockReset();
});

afterAll(async () => {
  if (db.end) await db.end();
  jest.restoreAllMocks();
});

describe('USERS endpoints', () => {
  test('GET /api/users -> 200 and returns array', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ user_id: 1, first_name: 'Ana' }] });
    const res = await request(app).get('/api/users');
  // (no debug logs) 
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/users/:id -> 400 on invalid id', async () => {
    const res = await request(app).get('/api/users/abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /api/users/:id -> 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
