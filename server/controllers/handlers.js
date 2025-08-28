// handlers.js - Updated to use PostgreSQL instead of in-memory array

const db = require('../config/database');

// GET all users
const getItems = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        user_id, 
        first_name, 
        last_name, 
        email, 
        phone, 
        created_at, 
        updated_at 
      FROM users 
      ORDER BY user_id DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET user by ID
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await db.query(`
      SELECT 
        user_id, 
        first_name, 
        last_name, 
        email, 
        phone, 
        created_at, 
        updated_at 
      FROM users 
      WHERE user_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST create new user
const postItem = async (req, res) => {
  try {
    const { first_name, last_name, email, password_hash, phone } = req.body || {};

    // Validation
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ 
        error: 'First name, last name, and email are required' 
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    const result = await db.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, phone) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING user_id, first_name, last_name, email, phone, created_at
    `, [first_name, last_name, email, password_hash || 'temp_hash', phone]);

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle unique constraint violation (duplicate email)
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: 'Email already exists. Please use a different email address.' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};

// UPDATE user by ID  
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone } = req.body || {};

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const checkUser = await db.query('SELECT user_id FROM users WHERE user_id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build dynamic update query
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramCount}`);
      values.push(first_name);
      paramCount++;
    }
    
    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramCount}`);
      values.push(last_name);
      paramCount++;
    }
    
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add user_id to values array
    values.push(id);
    
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $${paramCount} 
      RETURNING user_id, first_name, last_name, email, phone, updated_at
    `;

    const result = await db.query(query, values);

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE user by ID
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const result = await db.query(`
      DELETE FROM users 
      WHERE user_id = $1 
      RETURNING user_id, first_name, last_name, email
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User deleted successfully', 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    // Handle foreign key constraint violations
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete user. User has associated records (orders, cart items, etc.)' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getItems, getItemById, postItem, updateItem, deleteItem };