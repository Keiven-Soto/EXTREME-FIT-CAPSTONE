const db = require('../config/database');

/**
 * Middleware to get user from database using clerk_id from Clerk JWT
 * Requires clerkMiddleware to be set up first in server.js
 */
const getClerkUser = async (req, res, next) => {
  console.log('🔍 getClerkUser middleware called');
  console.log('🔍 req.auth():', req.auth());
  
  try {
    const clerkId = req.auth()?.userId;
    console.log('🔍 Extracted clerkId:', clerkId);

    if (!clerkId) {
      console.error('❌ No clerkId found in req.auth');
      return res.status(401).json({ error: 'Unauthorized - No clerk ID found' });
    }

    console.log('🔍 Querying database for clerk_id:', clerkId);
    const result = await db.query(
      'SELECT * FROM users WHERE clerk_id = $1',
      [clerkId]
    );

    console.log('🔍 Database query result:', result.rows);

    if (result.rows.length === 0) {
      console.error('❌ User not found in database for clerk_id:', clerkId);
      return res.status(404).json({
        error: 'User not found in database'
      });
    }

    console.log('✅ User found:', result.rows[0]);
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('❌ Error in getClerkUser middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getClerkUser };