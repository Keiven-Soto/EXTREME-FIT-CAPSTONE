const express = require('express');
const router = express.Router();
const { Webhook } = require('svix');
const User = require('../models/User'); // Your user model

// Clerk webhook endpoint
router.post('/clerk', async (req, res) => {
  try {
    // Verify the webhook is from Clerk
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      throw new Error('Please add CLERK_WEBHOOK_SECRET to .env');
    }

    // Get headers
    const headers = req.headers;
    const payload = JSON.stringify(req.body);

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
      return res.status(400).json({ error: 'Webhook verification failed' });
    }

    // Handle the webhook event
    const { type, data } = evt;

    switch (type) {
      case 'user.created':
        // Create user in your database
        await User.create({
          clerkId: data.id,
          email: data.email_addresses[0].email_address,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          profileImage: data.image_url || '',
          createdAt: new Date(data.created_at),
        });
        console.log('✅ User created in database:', data.id);
        break;

      case 'user.updated':
        // Update user in your database
        await User.findOneAndUpdate(
          { clerkId: data.id },
          {
            email: data.email_addresses[0].email_address,
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            profileImage: data.image_url || '',
          }
        );
        console.log('✅ User updated in database:', data.id);
        break;

      case 'user.deleted':
        // Delete user from your database
        await User.findOneAndDelete({ clerkId: data.id });
        console.log('✅ User deleted from database:', data.id);
        break;

      default:
        console.log('Unhandled webhook type:', type);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

module.exports = router;