const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  getOrderItems,
  createOrderItem
} = require('../controllers/orders_handler');

// Orders
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.post('/orders', createOrder);

// Order Items
router.get('/orders/:id/items', getOrderItems);
router.post('/orders/:id/items', createOrderItem);

module.exports = router;
