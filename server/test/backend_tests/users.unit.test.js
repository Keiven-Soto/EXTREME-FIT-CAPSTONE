// Ensure central setup is loaded so global.__DB_MOCK__ exists BEFORE modules
// that require the DB are imported.
require('../setupTests');
const handlers = require('../../controllers/handlers');
const db = global.__DB_MOCK__ || require('../../config/database');
// Inject the mock DB into the handlers module so its internal `db` uses the
// same mock instance.
if (handlers.setDb) handlers.setDb(db);

describe('Users controller unit tests', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  test('getUsers -> should call res.json with rows array', async () => {
    const req = {};
    const res = { json: jest.fn(), status: jest.fn(() => res) };

    db.query.mockResolvedValueOnce({ rows: [{ user_id: 1, first_name: 'Ana' }] });

    await handlers.getUsers(req, res);

    expect(db.query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([{ user_id: 1, first_name: 'Ana' }]);
  });

  test('getUserById -> invalid id returns 400', async () => {
    const req = { params: { id: 'abc' } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };

    await handlers.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  test('getUserById -> DB error returns 500', async () => {
    const req = { params: { id: '1' } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };

    db.query.mockRejectedValueOnce(new Error('DB fail'));

    await handlers.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });
});
