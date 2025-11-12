const express = require('express');
const router = express.Router();
const paymentsHandler = require('../controllers/payments_handler');

// POST /api/payments/create-payment-intent
router.post('/create-payment-intent', paymentsHandler.createPaymentIntent);

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', paymentsHandler.createCheckoutSession);

// Health check
router.get('/ping', (req, res) => res.json({ success: true, message: 'Payments route active' }));

module.exports = router;
