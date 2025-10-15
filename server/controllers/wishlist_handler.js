const db = require("../config/database");

const getWishlistItem = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (isNaN(user_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const result = await db.query(
      `
      SELECT wishlist_id, user_id, product_id, added_at FROM wishlist WHERE user_id = $1 ORDER BY added_at
    `,
      [user_id]
    );

    // if (result.rows.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     error: "No wishlist items were found",
    //   });
    // }

    res.json({
      success: true,
      data: result.rows,
    });

    console.log("✅ Fetched wishlist.");
  } catch (error) {
    console.error("❌ Error fetching wishlist items:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getWishlistItemById = async (req, res) => {
  try {
    const { user_id, product_id } = req.params;

    if (isNaN(user_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    if (isNaN(product_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID",
      });
    }

    const result = await db.query(
      `
      SELECT * FROM wishlist WHERE user_id = $1 AND product_id = $2
    `,
      [user_id, product_id]
    );

    res.json({
      success: true,
      data: result.rows,
    });

    console.log("✅ Fetched product from wishlist.");
  } catch (error) {
    console.error("❌ Error fetching wishlist item:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Remove a product from the user's wishlist
const deleteWishlistItem = async (req, res) => {
  try {
    // Prefer body values for endpoints like DELETE /api/wishlist/remove with JSON body
    const user_id = req.body.userId;
    const product_id = req.body.productId;

    if (isNaN(user_id) || isNaN(product_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user_id or product_id",
      });
    }

    const result = await db.query(
      "DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING *",
      [user_id, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Wishlist product not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });

    console.log("✅ Removed from wishlist.");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const addWishlistItem = async (req, res) => {
  try {
    user_id = req.body.userId;
    product_id = req.body.productId;

    if (isNaN(user_id) || isNaN(product_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user_id or product_id",
      });
    }

    const result = await db.query(
      "INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) RETURNING *;",
      [user_id, product_id]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });

    console.log("✅ Added to wishlist.");
  } catch (error) {
    console.error("Error adding to wishlist:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });

    console.log("❌ Failed to add to wishlist.");
  }
};

module.exports = {
  getWishlistItem,
  getWishlistItemById,
  deleteWishlistItem,
  addWishlistItem,
};
