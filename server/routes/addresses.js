const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { getClerkUser } = require('../middleware/clerkUser');

// Get all addresses for the authenticated user
router.get('/user/me', getClerkUser, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM addresses WHERE user_id = $1 order by is_default desc', [req.user.user_id]);
    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all addresses for a user (by user_id param - for admin use)
router.get('/user/:userId', getClerkUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query('SELECT * FROM addresses WHERE user_id = $1 order by is_default desc', [userId]);
    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create new address for authenticated user
router.post('/user/me', getClerkUser, async (req, res) => {
  try {
    const { street_address, city, state, postal_code, country, is_default } = req.body;
    // phone may be nullable
    const phone = req.body.phone ? String(req.body.phone).trim() : null;

    // Validate required fields early to return a helpful error
    if (!street_address || !String(street_address).trim()) {
      return res.status(400).json({ success: false, error: 'street_address is required' });
    }
    if (!city || !String(city).trim()) {
      return res.status(400).json({ success: false, error: 'city is required' });
    }
    if (!state || !String(state).trim()) {
      return res.status(400).json({ success: false, error: 'state is required' });
    }
    if (!postal_code || !String(postal_code).trim()) {
      return res.status(400).json({ success: false, error: 'postal_code is required' });
    }
    if (!country || !String(country).trim()) {
      return res.status(400).json({ success: false, error: 'country is required' });
    }
    // Basic phone validation (optional, allows international +, digits, spaces, parentheses and dashes)
    if (phone && !/^\+?[0-9 ()\-]{4,30}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone format' });
    }

    const result = await db.query(
      `INSERT INTO addresses (user_id, street_address, city, state, postal_code, country, is_default, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.user_id, street_address, city, state, postal_code, country, is_default || false, phone]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create new address (by user_id param - for admin use)
router.post('/user/:userId', getClerkUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { street_address, city, state, postal_code, country, is_default } = req.body;
    // phone may be nullable
    const phone = req.body.phone ? String(req.body.phone).trim() : null;

    // Validate required fields early
    if (!street_address || !String(street_address).trim()) {
      return res.status(400).json({ success: false, error: 'street_address is required' });
    }
    if (!city || !String(city).trim()) {
      return res.status(400).json({ success: false, error: 'city is required' });
    }
    if (!state || !String(state).trim()) {
      return res.status(400).json({ success: false, error: 'state is required' });
    }
    if (!postal_code || !String(postal_code).trim()) {
      return res.status(400).json({ success: false, error: 'postal_code is required' });
    }
    if (!country || !String(country).trim()) {
      return res.status(400).json({ success: false, error: 'country is required' });
    }
    // Basic phone validation
    if (phone && !/^\+?[0-9 ()\-]{4,30}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone format' });
    }

    const result = await db.query(
      `INSERT INTO addresses (user_id, street_address, city, state, postal_code, country, is_default, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, street_address, city, state, postal_code, country, is_default || false, phone]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update address
router.put('/:addressId', getClerkUser, async (req, res) => {
  try {
    const { addressId } = req.params;
    const { street_address, city, state, postal_code, country, is_default } = req.body;
    const phone = req.body.phone ? String(req.body.phone).trim() : null;

    // Basic phone validation
    if (phone && !/^\+?[0-9 ()\-]{4,30}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone format' });
    }

    // Validate required fields early
    if (!street_address || !String(street_address).trim()) {
      return res.status(400).json({ success: false, error: 'street_address is required' });
    }
    if (!city || !String(city).trim()) {
      return res.status(400).json({ success: false, error: 'city is required' });
    }
    if (!state || !String(state).trim()) {
      return res.status(400).json({ success: false, error: 'state is required' });
    }
    if (!postal_code || !String(postal_code).trim()) {
      return res.status(400).json({ success: false, error: 'postal_code is required' });
    }
    if (!country || !String(country).trim()) {
      return res.status(400).json({ success: false, error: 'country is required' });
    }

    if (is_default) {
      const userRes = await db.query('SELECT user_id FROM addresses WHERE address_id = $1', [addressId]);
      const userId = userRes.rows[0]?.user_id;
      if (userId) {
        await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
      }
    }

    const result = await db.query(
      `UPDATE addresses SET street_address=$1, city=$2, state=$3, postal_code=$4, country=$5, is_default=$6, phone=$7
       WHERE address_id=$8 RETURNING *`,
      [street_address, city, state, postal_code, country, is_default, phone, addressId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Set a single address as the default (clear others) - safe endpoint that doesn't require full payload
router.put('/:addressId/set-default', getClerkUser, async (req, res) => {
  try {
    const { addressId } = req.params;

    // Find the owner of the address
    const userRes = await db.query('SELECT user_id FROM addresses WHERE address_id = $1', [addressId]);
    const userId = userRes.rows[0]?.user_id;
    if (!userId) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    // Unset existing defaults and set this one atomically via two queries
    await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    const result = await db.query('UPDATE addresses SET is_default = true WHERE address_id = $1 RETURNING *', [addressId]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error in set-default endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete address
router.delete('/:addressId', getClerkUser, async (req, res) => {
  try {
    const { addressId } = req.params;
    await db.query('DELETE FROM addresses WHERE address_id = $1', [addressId]);
    res.json({ 
      success: true, 
      data: { message: 'Address deleted' } 
    });
  } catch (error) {
    // Handle foreign key constraint violation (address referenced by orders)
    // Postgres uses SQLSTATE error code '23503' for foreign_key_violation
    if (error && error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Address cannot be deleted because it is referenced by existing orders.',
        originalError: error.message
      });
    }

    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router; 