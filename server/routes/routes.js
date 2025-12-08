const db = require('../config/database');
const express = require('express');
const router = express.Router();
const { getUsers, getUserById, postUser, updateUser, deleteUser } = require('../controllers/handlers');
const { getClerkUser } = require('../middleware/clerkUser');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Test database connection endpoint (public)
router.get('/test-db', async (req, res) => {
  console.log('✅ /test-db route hit');
  try {
    const db = require("../config/database");
    const result = await db.query("SELECT NOW() as current_time, version()");
    res.json({
      status: "Connected ✅",
      database: process.env.DB_NAME || "extremefit_dev",
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error ❌",
      message: error.message,
    });
  }
});

// GET current authenticated user info
router.get('/users/me', (req, res, next) => {
  console.log('🎯 /users/me route HIT!');
  console.log('🎯 req.auth before middleware:', req.auth);
  next();
}, getClerkUser, async (req, res) => {
  console.log('🎯 Inside final /users/me handler');
  console.log('🎯 req.user:', req.user);
  
  try {
    res.json(req.user);
  } catch (error) {
    console.error('❌ Error in /users/me final handler:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all users
router.get("/users", getUsers);

// Get user by ID
router.get("/users/:id", getUserById);

// POST a new user
router.post("/users", postUser);

// TESTING BULK CREATE USERS - NEW ENDPOINT (No auth required)
router.post("/users/bulk", async (req, res) => {
  console.log('📦 Bulk user creation endpoint hit');
  const { users } = req.body;
  
  if (!users || !Array.isArray(users)) {
    return res.status(400).json({ error: 'Users array is required' });
  }

  try {
    const results = [];
    const errors = [];

    for (const userData of users) {
      try {
        console.log(`Creating user: ${userData.email}`);
        
        // Create user in Clerk
        const clerkUser = await clerkClient.users.createUser({
          emailAddress: [userData.email],
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });

        console.log(`✅ Clerk user created: ${clerkUser.id}`);

        // Create user in your database
        const dbUser = await db.query(
          'INSERT INTO users (clerk_id, email, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
          [clerkUser.id, userData.email, userData.firstName, userData.lastName]
        );

        console.log(`✅ Database user created for: ${userData.email}`);

        results.push({
          success: true,
          email: userData.email,
          clerkId: clerkUser.id,
          dbUser: dbUser.rows[0]
        });
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
        errors.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk user creation completed',
      created: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('❌ Bulk user creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a user by ID
router.put("/users/:id", updateUser);

// DELETE a user by ID
router.delete("/users/:id", deleteUser);

module.exports = router;
