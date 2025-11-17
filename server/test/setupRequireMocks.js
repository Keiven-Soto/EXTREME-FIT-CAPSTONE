// Minimal pre-mock injection run early via Jest `setupFiles`.
// This file must NOT use jest.fn() because `setupFiles` runs before
// the Jest environment is available. It simply prevents the real
// database module from being loaded too early by placing a lightweight
// placeholder into require.cache. `setupTests.js` (setupFilesAfterEnv)
// will replace this placeholder with a proper jest mock later.
const path = require('path');
const Module = require('module');

const dbAbsolutePath = path.resolve(process.cwd(), 'config', 'database.js');
try {
  // Only inject when not running integration tests
  if (String(process.env.RUN_INTEGRATION).toLowerCase() !== 'true') {
    const placeholder = {
      query: async () => ({ rows: [] }),
      end: async () => {},
    };

    const cachedModule = new Module(dbAbsolutePath, module.parent);
    cachedModule.filename = dbAbsolutePath;
    cachedModule.exports = placeholder;

    try {
      const resolved = require.resolve(dbAbsolutePath);
      require.cache[resolved] = cachedModule;
    } catch (e) {
      // ignore if resolve fails
    }
    require.cache[dbAbsolutePath] = cachedModule;
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('setupRequireMocks: could not inject DB placeholder:', err && err.message);
}
