// Unit tests for controllers/handlers.js
// These tests inject a mock DB via handlers.setDb and assert response behavior
require('../setupTests');

const handlers = require('../../controllers/handlers');

describe('controllers/handlers unit tests', () => {
  let mockDb;
  let res;

  beforeEach(() => {
    mockDb = { query: jest.fn(), end: jest.fn().mockResolvedValue() };
    if (handlers.setDb) handlers.setDb(mockDb);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getUsers -> responds with rows from db', async () => {
    const req = {};
    mockDb.query.mockResolvedValueOnce({ rows: [{ user_id: 1, first_name: 'Ana' }] });

    await handlers.getUsers(req, res);

    expect(mockDb.query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([{ user_id: 1, first_name: 'Ana' }]);
  });

  test('getUsers -> DB error -> 500', async () => {
    const req = {};
    mockDb.query.mockRejectedValueOnce(new Error('DB fail'));

    await handlers.getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
  });

  test('getUserById -> invalid id -> 400', async () => {
    const req = { params: { id: 'abc' } };

    await handlers.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user ID' });
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  test('getUserById -> db error -> 500', async () => {
    const req = { params: { id: '1' } };
    mockDb.query.mockRejectedValueOnce(new Error('DB fail'));

    await handlers.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
  });

  test('getUserById -> not found -> 404', async () => {
    const req = { params: { id: '2' } };
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    await handlers.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('getUserById -> success -> returns user', async () => {
    const req = { params: { id: '3' } };
    const user = { user_id: 3, first_name: 'Bob' };
    mockDb.query.mockResolvedValueOnce({ rows: [user] });

    await handlers.getUserById(req, res);

    expect(res.json).toHaveBeenCalledWith(user);
  });

  test('postUser -> missing required -> 400', async () => {
    const req = { body: { last_name: 'X' } };

    await handlers.postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'First name and email are required' });
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  test('postUser -> invalid email -> 400', async () => {
    const req = { body: { first_name: 'A', email: 'bad-email' } };

    await handlers.postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Please provide a valid email address' });
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  test('postUser -> db duplicate email -> 400', async () => {
    const req = { body: { first_name: 'A', email: 'a@b.com' } };
    const err = new Error('dup');
    err.code = '23505';
    mockDb.query.mockRejectedValueOnce(err);

    await handlers.postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Email already exists. Please use a different email address.',
    });
  });

  test('postUser -> success -> 201 with user', async () => {
    const body = { first_name: 'Ana', last_name: 'S', email: 'a@b.com' };
    const req = { body };
    const created = { user_id: 5, first_name: 'Ana', email: 'a@b.com' };
    mockDb.query.mockResolvedValueOnce({ rows: [created] });

    await handlers.postUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      user: created,
    });
  });

  test('updateUser -> invalid id -> 400', async () => {
    const req = { params: { id: 'x' }, body: { first_name: 'Z' } };

    await handlers.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user ID' });
  });

  test('updateUser -> user not found -> 404', async () => {
    const req = { params: { id: '10' }, body: { first_name: 'Z' } };
    mockDb.query.mockResolvedValueOnce({ rows: [] }); // checkUser

    await handlers.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('updateUser -> no fields to update -> 400', async () => {
    const req = { params: { id: '11' }, body: {} };
    mockDb.query.mockResolvedValueOnce({ rows: [{ user_id: 11 }] }); // checkUser

    await handlers.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No fields to update' });
  });

  test('updateUser -> success -> returns updated user', async () => {
    const req = { params: { id: '12' }, body: { first_name: 'New' } };
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ user_id: 12 }] }) // checkUser
      .mockResolvedValueOnce({ rows: [{ user_id: 12, first_name: 'New' }] }); // update

    await handlers.updateUser(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'User updated successfully',
      user: { user_id: 12, first_name: 'New' },
    });
  });

  test('deleteUser -> invalid id -> 400', async () => {
    const req = { params: { id: 'no' } };

    await handlers.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user ID' });
  });

  test('deleteUser -> not found -> 404', async () => {
    const req = { params: { id: '20' } };
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    await handlers.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('deleteUser -> foreign key violation -> 400', async () => {
    const req = { params: { id: '21' } };
    const err = new Error('fk');
    err.code = '23503';
    mockDb.query.mockRejectedValueOnce(err);

    await handlers.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Cannot delete user. User has associated records (orders, cart items, etc.)',
    });
  });

  test('deleteUser -> success -> returns deleted user', async () => {
    const req = { params: { id: '22' } };
    const deleted = { user_id: 22, first_name: 'Gone' };
    mockDb.query.mockResolvedValueOnce({ rows: [deleted] });

    await handlers.deleteUser(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'User deleted successfully',
      user: deleted,
    });
  });
});
