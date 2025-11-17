const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

// Parses raw body - Stripe requires raw body for signature verification
router.use(express.raw({ type: 'application/json' }));

// Handle successful payment intent (for mobile Payment Sheet)
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('✅ PaymentIntent succeeded:', paymentIntent.id);

    const orderId = paymentIntent.metadata.order_id;

    if (!orderId) {
      console.error('No order_id in payment intent metadata');
      return;
    }

    // Update order with payment details
    const updateQuery = `
      UPDATE orders
      SET
        stripe_payment_intent_id = $1,
        payment_status = 'paid',
        payment_completed_at = NOW(),
        order_status = 'confirmed'
      WHERE order_id = $2
    `;

    await db.query(updateQuery, [paymentIntent.id, orderId]);

    console.log(`Order ${orderId} marked as paid. Payment Intent: ${paymentIntent.id}`);

    // TODO: Send confirmation email to customer
    // TODO: Trigger order fulfillment process
  } catch (error) {
    console.error('Error handling payment intent:', error);
  }
}

// Handle successful checkout session (for web Checkout - if you use it)
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('✅ Checkout session completed:', session.id);

    const orderId = session.metadata.order_id;
    const paymentIntentId = session.payment_intent;

    if (!orderId) {
      console.error('No order_id in session metadata');
      return;
    }

    // Update order with payment details
    const updateQuery = `
      UPDATE orders
      SET
        stripe_payment_intent_id = $1,
        payment_status = 'paid',
        payment_completed_at = NOW(),
        order_status = 'confirmed'
      WHERE order_id = $2
    `;

    await db.query(updateQuery, [paymentIntentId, orderId]);

    console.log(`Order ${orderId} marked as paid. Payment Intent: ${paymentIntentId}`);

    // TODO: Send confirmation email to customer
    // TODO: Trigger order fulfillment process
  } catch (error) {
    console.error('Error handling checkout session:', error);
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('❌ PaymentIntent failed:', paymentIntent.id);

    const orderId = paymentIntent.metadata.order_id;

    if (!orderId) {
      console.error('No order_id in payment intent metadata');
      return;
    }

    // Update order to mark payment as failed
    const updateQuery = `
      UPDATE orders
      SET
        stripe_payment_intent_id = $1,
        payment_status = 'failed',
        order_status = 'payment_failed'
      WHERE order_id = $2
    `;

    await db.query(updateQuery, [paymentIntent.id, orderId]);

    const errorMessage = paymentIntent.last_payment_error?.message || 'Unknown error';
    console.log(`Order ${orderId} payment failed: ${errorMessage}`);

    // TODO: Send payment failure notification to customer
  } catch (error) {
    console.error('Error handling failed payment intent:', error);
  }
}

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    // Mobile Payment Sheet flow
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;

    // Web Checkout Session flow (if you use it)
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;

    // Refund handling
    case 'charge.refunded':
      console.log('💰 Charge refunded:', event.data.object.id);
      // TODO: Handle refund - update order status
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Acknowledge receipt
  res.json({ received: true });
});

module.exports = router;