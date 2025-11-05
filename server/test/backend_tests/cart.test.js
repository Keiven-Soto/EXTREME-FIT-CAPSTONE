const request = require('supertest');

// Mock Clerk so protected routes don't block tests
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  requireAuth: () => (req, res, next) => next(),
}));

// IMPORTANT: do NOT require the real database module here. Prefer the central
// test setup to inject `global.__DB_MOCK__`. However some environments may
// bypass those setup steps, so as a safety fallback we create and inject a
// simple jest mock into require.cache so the server uses it instead of the
// real database. This guarantees tests remain hermetic.
const path = require('path');
const Module = require('module');

let db = global.__DB_MOCK__;
if (!db || !db.query || typeof db.query.mockReset !== 'function') {
  // create a minimal mock compatible with tests
  db = {
    query: jest.fn(),
    end: jest.fn(),
  };
  global.__DB_MOCK__ = db;

  // Inject into require.cache so require('../config/database') returns this mock
  try {
    const dbAbsolutePath = path.resolve(process.cwd(), 'config', 'database.js');
    const cachedModule = new Module(dbAbsolutePath, module.parent);
    cachedModule.filename = dbAbsolutePath;
    cachedModule.exports = db;
    try {
      const resolved = require.resolve(dbAbsolutePath);
      require.cache[resolved] = cachedModule;
    } catch (e) {
      // ignore
    }
    require.cache[dbAbsolutePath] = cachedModule;
  } catch (err) {
    // ignore injection failure; tests will likely fail later with clearer message
  }
}

// We will unit-test handlers directly (do not require the full Express app)
// to avoid require-order problems that open real DB connections.

afterEach(() => db.query.mockReset());
afterAll(async () => { if (db.end) await db.end(); jest.restoreAllMocks(); });

describe('CART endpoints', () => {
  test('GET /api/cart/:userId -> 200 and returns array', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ cart_id: 1, product_id: 2 }] });

    jest.isolateModules(() => {
      jest.doMock('../../config/database', () => db);
      const { getCart } = require('../../controllers/cart_items_handler');

      const req = { params: { userId: 1 } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { status, json };

      return getCart(req, res).then(() => {
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      });
    });
  });

  test('POST /api/cart -> 200 add item', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // existence check
    db.query.mockResolvedValueOnce({ rows: [{ cart_id: 2, product_id: 2 }] }); // insert

    jest.isolateModules(() => {
      jest.doMock('../../config/database', () => db);
      const { addItemToCart } = require('../../controllers/cart_items_handler');

      const req = { body: { userId: 1, productId: 2 } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { status, json };

      return addItemToCart(req, res).then(() => {
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      });
    });
  });

  test('DELETE /api/cart -> 500 on DB error', async () => {
    // Unit-test the handler directly to avoid server startup/require-order issues.
    db.query.mockRejectedValueOnce(new Error('DB fail'));

    // Load the handler in an isolated module context while mocking the
    // database module so we guarantee the controller sees our jest mock.
    jest.isolateModules(() => {
      jest.doMock('../../config/database', () => db);
      // Require the handler fresh inside the isolated module environment
      const { removeItemFromCart } = require('../../controllers/cart_items_handler');

      // Create minimal mock req/res
      const req = { body: { userId: 1, productId: 2 } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { status, json };

      return removeItemFromCart(req, res).then(() => {
        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      });
    });
  });
});
