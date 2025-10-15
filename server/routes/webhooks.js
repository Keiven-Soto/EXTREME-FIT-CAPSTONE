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
          INSERT INTO users (clerk_id, first_name, last_name, email, phone, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (email) DO UPDATE 
          SET clerk_id = EXCLUDED.clerk_id
        `, [
          data.id, // ← This is the clerk_id!
          data.first_name || '',
          data.last_name || '',
          data.email_addresses[0]?.email_address,
          data.phone_numbers[0]?.phone_number || null
        ]);
        console.log('✅ User created:', data.email_addresses[0]?.email_address);
        break;

      case 'user.updated':
        await db.query(`
          UPDATE users
          SET first_name = $1, last_name = $2, email = $3, phone = $4, updated_at = NOW()
          WHERE clerk_id = $5
        `, [
          data.first_name,
          data.last_name,
          data.email_addresses[0]?.email_address,
          data.phone_numbers[0]?.phone_number || null,
          data.id
        ]);
        console.log('✅ User updated:', data.email_addresses[0]?.email_address, 'Clerk ID:', data.id);
        break;

      case 'user.deleted':
        await db.query('DELETE FROM users WHERE clerk_id = $1', [
          data.id
        ]);
        console.log('✅ User deleted:', data.email_addresses[0]?.email_address, 'Clerk ID:', data.id);
        break;

      default:
        console.log('Unhandled webhook type:', type);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;