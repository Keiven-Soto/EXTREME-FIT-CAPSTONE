const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database'); // ✅ UNCOMMENTED - needed for database queries

// Create a PaymentIntent for mobile
exports.createPaymentIntent = async (req, res) => {
  try {
    const { order_id } = req.body;

    console.log('💳 Creating PaymentIntent for order:', order_id);

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'order_id is required' });
    }

    // Fetch the order details from database
    const orderQuery = `
      SELECT o.*, u.email, u.first_name, u.last_name
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = $1
    `;
    const orderResult = await db.query(orderQuery, [order_id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Calculate amount in cents
    const amountInCents = Math.round(parseFloat(order.total_amount) * 100);

    console.log('💰 Amount:', amountInCents, 'cents ($' + order.total_amount + ')');

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        order_id: order_id.toString(),
        user_id: order.user_id?.toString() || '',
      },
      // Optional: pre-fill customer email
      receipt_email: order.email,
      description: `Order #${order_id} - ExtremeFit`,
      // Only allow card payments (credit/debit)
      payment_method_types: ['card'],
    });

    console.log('✅ PaymentIntent created:', paymentIntent.id);

    // Update order with payment intent ID
    await db.query(
      'UPDATE orders SET stripe_payment_intent_id = $1 WHERE order_id = $2',
      [paymentIntent.id, order_id]
    );

    return res.json({
      success: true,
      data: {
        paymentIntent: paymentIntent.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      },
    });
  } catch (error) {
    console.error('❌ createPaymentIntent error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Create a Stripe Checkout Session (for web if needed)
exports.createCheckoutSession = async (req, res) => {
  try {
    const { order_id, cancel_url, success_url } = req.body;

    // Validate required fields
    if (!order_id) {
      return res.status(400).json({ success: false, error: 'order_id is required' });
    }

    // Fetch the order details from database
    const orderQuery = `
      SELECT o.*, u.email, u.first_name, u.last_name
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = $1
    `;
    const orderResult = await db.query(orderQuery, [order_id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Fetch order items to create line items for Stripe
    const itemsQuery = `
      SELECT oi.*, p.name as product_name, p.cloudinary_public_id
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = $1
    `;
    const itemsResult = await db.query(itemsQuery, [order_id]);

    // Create line items for Stripe Checkout
    const line_items = itemsResult.rows.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product_name,
        },
        unit_amount: Math.round(parseFloat(item.unit_price) * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if present
    if (order.shipping_cost && parseFloat(order.shipping_cost) > 0) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: Math.round(parseFloat(order.shipping_cost) * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: success_url || `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.CLIENT_URL}/checkout?canceled=true`,
      customer_email: order.email,
      metadata: {
        order_id: order_id.toString(),
        user_id: order.user_id?.toString() || '',
      },
    });

    // Update order with checkout session ID
    await db.query(
      'UPDATE orders SET stripe_checkout_session_id = $1 WHERE order_id = $2',
      [session.id, order_id]
    );

    return res.json({
      success: true,
      data: {
        session_id: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};