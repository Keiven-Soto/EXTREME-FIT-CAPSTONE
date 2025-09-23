const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtener todas las direcciones de un usuario
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query('SELECT * FROM addresses WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear una nueva dirección para un usuario
router.post('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { street_address, city, state, postal_code, country, is_default, address_type } = req.body;
    const result = await db.query(
      `INSERT INTO addresses (user_id, street_address, city, state, postal_code, country, is_default, address_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, street_address, city, state, postal_code, country, is_default || false, address_type || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar una dirección
router.put('/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    const { street_address, city, state, postal_code, country, is_default, address_type } = req.body;
    const result = await db.query(
      `UPDATE addresses SET street_address=$1, city=$2, state=$3, postal_code=$4, country=$5, is_default=$6, address_type=$7
       WHERE address_id=$8 RETURNING *`,
      [street_address, city, state, postal_code, country, is_default, address_type, addressId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar una dirección
router.delete('/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    await db.query('DELETE FROM addresses WHERE address_id = $1', [addressId]);
    res.json({ message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;