const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderByIdWithDetails,
  createOrder,
  getOrderItems,
  createOrderItem,
  getOrdersByUserId
} = require('../controllers/orders_handler');

// Orders
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderByIdWithDetails);
router.post('/orders', createOrder);
router.get('/orders/user/:user_id', getOrdersByUserId); // Get all orders by user ID

// Order Items
router.get('/orders/:id/items', getOrderItems);
router.post('/orders/:id/items', createOrderItem);

module.exports = router;
