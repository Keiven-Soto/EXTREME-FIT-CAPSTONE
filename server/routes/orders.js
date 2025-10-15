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
const { getClerkUser } = require('../middleware/clerkUser');

// Orders
router.get('/', (req, res, next) => {next();}, getClerkUser, getOrders);
router.post('/', (req, res, next) =>  {next();}, getClerkUser, createOrder);
router.get('/user/:user_id', (req, res, next) => {next();},getClerkUser, getOrdersByUserId);

// Order Items
router.get('/:id/items', (req, res, next) =>  {next();}, getClerkUser, getOrderItems);
router.post('/:id/items', (req, res, next) =>  {next();}, getClerkUser, createOrderItem);
router.get('/:id', (req, res, next) => {next();}, getClerkUser, getOrderByIdWithDetails);

module.exports = router;