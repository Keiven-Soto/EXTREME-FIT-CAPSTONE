const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { getClerkUser } = require('../middleware/clerkUser');

// Get all addresses for the authenticated user
router.get('/user/me', getClerkUser, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM addresses WHERE user_id = $1', [req.user.user_id]);
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
    const result = await db.query('SELECT * FROM addresses WHERE user_id = $1', [userId]);
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
    const { street_address, city, state, postal_code, country, is_default, address_type } = req.body;
    
    const result = await db.query(
      `INSERT INTO addresses (user_id, street_address, city, state, postal_code, country, is_default, address_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.user_id, street_address, city, state, postal_code, country, is_default || false, address_type || null]
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
    const { street_address, city, state, postal_code, country, is_default, address_type } = req.body;
    
    const result = await db.query(
      `INSERT INTO addresses (user_id, street_address, city, state, postal_code, country, is_default, address_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, street_address, city, state, postal_code, country, is_default || false, address_type || null]
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
    const { street_address, city, state, postal_code, country, is_default, address_type } = req.body;

    if (is_default) {
      const userRes = await db.query('SELECT user_id FROM addresses WHERE address_id = $1', [addressId]);
      const userId = userRes.rows[0]?.user_id;
      if (userId) {
        await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
      }
    }

    const result = await db.query(
      `UPDATE addresses SET street_address=$1, city=$2, state=$3, postal_code=$4, country=$5, is_default=$6, address_type=$7
       WHERE address_id=$8 RETURNING *`,
      [street_address, city, state, postal_code, country, is_default, address_type, addressId]
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
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;