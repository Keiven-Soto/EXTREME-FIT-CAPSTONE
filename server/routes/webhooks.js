const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { Webhook } = require('svix');

router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      throw new Error('Missing CLERK_WEBHOOK_SECRET');
    }

    // Get the raw body as string
    const payload = req.body.toString('utf8');
    const headers = req.headers;

    // Verify webhook signature
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;
    
    try {
      evt = wh.verify(payload, {
        'svix-id': headers['svix-id'],
        'svix-timestamp': headers['svix-timestamp'],
        'svix-signature': headers['svix-signature'],
      });
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parse the verified payload
    const { type, data } = evt;

    switch (type) {
      case 'user.created':
        await db.query(`
          INSERT INTO users (clerk_id, first_name, last_name, email, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (email) DO UPDATE
          SET clerk_id = EXCLUDED.clerk_id
        `, [
          data.id,
          data.first_name || '',
          data.last_name || '',
          data.email_addresses[0]?.email_address
        ]);
        console.log('✅ User created:', data.email_addresses[0]?.email_address);
        break;

      case 'user.updated':
        await db.query(`
          UPDATE users
          SET first_name = $1, last_name = $2, email = $3, updated_at = NOW()
          WHERE clerk_id = $4
        `, [
          data.first_name,
          data.last_name,
          data.email_addresses[0]?.email_address,
          data.id
        ]);
        console.log('✅ User updated:', data.email_addresses[0]?.email_address, 'Clerk ID:', data.id);
        break;

      case 'user.deleted':
        
        // First, get the user_id from the database
        const userResult = await db.query(
          'SELECT user_id FROM users WHERE clerk_id = $1',
          [data.id]
        );

        if (userResult.rows.length === 0) {
          // Still return success since user is already gone
          return res.status(200).json({ success: true, message: 'User not found' });
        }

        const userId = userResult.rows[0].user_id;

        // 1. Delete cart items
        await db.query('DELETE FROM cart WHERE user_id = $1', [userId]);

        // 2. Delete wishlist items
        await db.query('DELETE FROM wishlist WHERE user_id = $1', [userId]);

        // 3. Delete order items (must be before orders)
        await db.query(`
          DELETE FROM order_items 
          WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = $1)
        `, [userId]);

        // 4. Delete orders
        await db.query('DELETE FROM orders WHERE user_id = $1', [userId]);

        // 5. Delete addresses
        await db.query('DELETE FROM addresses WHERE user_id = $1', [userId]);

        // 6. Finally, delete the user
        await db.query('DELETE FROM users WHERE clerk_id = $1', [data.id]);
        break;

      default:
        console.log('Unhandled webhook type:', type);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;