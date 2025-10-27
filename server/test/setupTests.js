// Central test setup: mocks and global helpers for Jest
// This file is loaded with `setupFilesAfterEnv` (jest) so `jest.fn()` is available.

// Clear cached app modules so tests always load a fresh server that picks up
// the mocks we inject below. This avoids order-dependent behavior when some
// test files require the app before mocks are in place.
(() => {
  const root = process.cwd();
  Object.keys(require.cache).forEach((key) => {
    if (!key) return;
    const normalized = key.replace(/\\/g, '/');
    if (
      normalized.startsWith(root.replace(/\\/g, '/')) &&
      (normalized.includes('/routes/') || normalized.includes('/controllers/') || normalized.includes('/middleware/') || normalized.endsWith('/server.js'))
    ) {
      delete require.cache[key];
    }
  });
})();

// 1) Mock Clerk middleware so protected routes don't block tests
jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  requireAuth: () => (req, res, next) => next(),
}));

// 1.b) Mock our own getClerkUser middleware (used in routes) so it doesn't
// attempt DB queries during tests. We resolve the module by absolute path to
// ensure the mock matches the module imported by the routes.
const path = require('path');
const Module = require('module');

const clerkUserAbsolutePath = path.resolve(process.cwd(), 'middleware', 'clerkUser.js');
try {
  const clerkMod = new Module(clerkUserAbsolutePath, module.parent);
  clerkMod.filename = clerkUserAbsolutePath;
  clerkMod.exports = { getClerkUser: () => (req, res, next) => next() };
  // Put under both the absolute path and the resolved path (if possible)
  try {
    const resolved = require.resolve(clerkUserAbsolutePath);
    require.cache[resolved] = clerkMod;
  } catch (e) {
    // ignore
  }
  require.cache[clerkUserAbsolutePath] = clerkMod;
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('Could not inject mock for middleware/clerkUser:', err.message);
}

// 2) Inject a DB mock into Node's require cache so any relative require of
//    config/database returns the same mock across unit tests. When running
//    integration tests (`RUN_INTEGRATION=true`) we MUST NOT inject the
//    mock so tests exercise the real DB.
const dbAbsolutePath = path.resolve(process.cwd(), 'config', 'database.js');

let dbMock;
if (String(process.env.RUN_INTEGRATION).toLowerCase() !== 'true') {
  // Create a simple mock with jest.fn() for query/end and expose helpers
  dbMock = {
    query: jest.fn(),
    end: jest.fn(),
  };

  // Create a fresh Module object and put it into require.cache under the
  // resolved absolute path. When tests do require('../../config/database')
  // Node will resolve to the same absolute path and return this mock.
  try {
    const cachedModule = new Module(dbAbsolutePath, module.parent);
    cachedModule.filename = dbAbsolutePath;
    cachedModule.exports = dbMock;
    // Put the cached module under multiple possible keys to increase the
    // chance we match how other modules resolve it (absolute path, resolved
    // path via require.resolve, etc.). This reduces order-dependent issues.
    try {
      const resolved = require.resolve(dbAbsolutePath);
      require.cache[resolved] = cachedModule;
    } catch (e) {
      // ignore
    }
    require.cache[dbAbsolutePath] = cachedModule;
  } catch (err) {
    // If injection fails, log so it's visible in test output
    // but don't throw — tests may still require the real module.
    // eslint-disable-next-line no-console
    console.warn('Could not inject DB mock into require.cache:', err.message);
  }

  // Expose the mock globally so suites can access and configure it easily
  global.__DB_MOCK__ = dbMock;

  // Reset mocks between tests to avoid cross-test pollution when Jest runs
  // multiple suites (even with --runInBand) — tests should be hermetic.
  if (dbMock && dbMock.query && dbMock.end) {
    beforeEach(() => {
      dbMock.query.mockReset();
      dbMock.end.mockReset();
    });

    afterAll(async () => {
      if (dbMock.end) await dbMock.end();
    });
  }
} else {
  // Integration mode: do not inject a DB mock. Tests should connect to the
  // real database. Log this so test output clearly shows which mode ran.
  // eslint-disable-next-line no-console
  console.log('RUN_INTEGRATION=true — skipping DB mock injection (integration mode)');
}
