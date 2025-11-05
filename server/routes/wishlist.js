const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const {
  getWishlistItem,
  getWishlistItemById,
  deleteWishlistItem,
  addWishlistItem,
} = require("../controllers/wishlist_handler");

// 🔐 All wishlist routes require authentication
router.use(requireAuth());

// Route to get wishlist items for a specific user
router.get("/:user_id", getWishlistItem);
router.get("/:user_id/:product_id", getWishlistItemById);

// Route to remove an item from the wishlist
router.delete("/remove", deleteWishlistItem);

// Route to add an item to the wishlist
router.post("/add", addWishlistItem);

module.exports = router;
