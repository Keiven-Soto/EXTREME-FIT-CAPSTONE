const db = require('../config/database');

// GET all orders
const getOrders = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders ORDER BY order_id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET all orders by user ID
const getOrdersByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY order_id DESC', [user_id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM orders WHERE order_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET order by ID with user and address details
const getOrderByIdWithDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT o.*, 
              a.street_address, a.city, a.state, a.postal_code, a.country,
              u.first_name, u.last_name, u.email
       FROM orders o
       LEFT JOIN addresses a ON o.shipping_address_id = a.address_id
       LEFT JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order with details not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST create new order
const createOrder = async (req, res) => {
  try {
    const { user_id, total_amount, shipping_cost, payment_method, payment_status, order_status, shipping_address_id } = req.body;
    const result = await db.query(
      `INSERT INTO orders (user_id, total_amount, shipping_cost, payment_method, payment_status, order_status, shipping_address_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, total_amount, shipping_cost, payment_method, payment_status, order_status, shipping_address_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET order items for an order
const getOrderItems = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST create order item for an order
const createOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity, unit_price, size, color } = req.body;
    const result = await db.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, size, color)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, product_id, quantity, unit_price, size, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  getOrderByIdWithDetails,
  createOrder,
  getOrderItems,
  createOrderItem,
  getOrdersByUserId,
};
