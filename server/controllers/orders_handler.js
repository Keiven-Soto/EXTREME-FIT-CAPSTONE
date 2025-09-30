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
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM orders WHERE order_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
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
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST create order item for an order
const createOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity, unit_price } = req.body;
    const result = await db.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, product_id, quantity, unit_price]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  getOrderItems,
  createOrderItem,
  getOrdersByUserId,
};
