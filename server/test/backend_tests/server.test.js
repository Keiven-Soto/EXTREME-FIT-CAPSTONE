const request = require('supertest');
const app = require('../../server');
const dbPool = require('../../config/database');

describe('Server basic routes', () => {
  test('GET / should return welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'ExtremeFit API is running!');
  });

  // Close DB pool after tests to avoid open handle warnings
  afterAll(async () => {
    if (dbPool && dbPool.end) {
      await dbPool.end();
    }
  });
});
