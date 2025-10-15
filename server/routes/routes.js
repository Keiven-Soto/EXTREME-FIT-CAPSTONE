const db = require('../config/database');
const express = require('express');
const router = express.Router();
const { getUsers, getUserById, postUser, updateUser, deleteUser } = require('../controllers/handlers');
const { getClerkUser } = require('../middleware/clerkUser');

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

// UPDATE a user by ID
router.put("/users/:id", updateUser);

// DELETE a user by ID
router.delete("/users/:id", deleteUser);

module.exports = router;
