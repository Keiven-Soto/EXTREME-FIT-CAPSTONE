/**
 * Script to sync Clerk IDs for existing users
 * Run this once to backfill clerk_id for users created before the webhook
 */
const db = require('../config/database');
const { clerkClient } = require('@clerk/express');
require('dotenv').config();

async function syncClerkIds() {
  try {
    console.log('🔄 Starting Clerk ID sync...\n');

    // Get all users without a clerk_id
    const result = await db.query(`
      SELECT user_id, email, first_name, last_name
      FROM users
      WHERE clerk_id IS NULL OR clerk_id = ''
    `);

    const usersWithoutClerkId = result.rows;

    if (usersWithoutClerkId.length === 0) {
      console.log('✅ All users already have clerk_id. Nothing to sync.');
      process.exit(0);
    }

    console.log(`Found ${usersWithoutClerkId.length} users without clerk_id:\n`);

    for (const user of usersWithoutClerkId) {
      console.log(`📧 Looking up: ${user.email} (DB ID: ${user.user_id})`);

      try {
        // Search for user in Clerk by email
        const clerkUsers = await clerkClient.users.getUserList({
          emailAddress: [user.email],
        });

        if (clerkUsers.data && clerkUsers.data.length > 0) {
          const clerkUser = clerkUsers.data[0];

          console.log(`   ✅ Found in Clerk: ${clerkUser.id}`);
          console.log(`   Name: ${clerkUser.firstName} ${clerkUser.lastName}`);

          // Update database with clerk_id
          await db.query(
            'UPDATE users SET clerk_id = $1 WHERE user_id = $2',
            [clerkUser.id, user.user_id]
          );

          console.log(`   💾 Updated database with clerk_id\n`);
        } else {
          console.log(`   ⚠️  Not found in Clerk - user may need to sign up again\n`);
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${user.email}:`, error.message, '\n');
      }
    }

    console.log('✅ Clerk ID sync complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncClerkIds();
