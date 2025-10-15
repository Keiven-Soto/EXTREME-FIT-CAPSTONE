const db = require("../config/database");

// GET all products
const getProducts = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products ORDER BY product_id");

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid product ID",
      });
    }

    const result = await db.query(
        `SELECT * FROM products WHERE product_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });

    console.log("✅ Fetched product.");
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getGenders = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT
        gender
      FROM products
    `);

    res.json({
      success: true,
      data: result.rows,
    });

    console.log("✅ Fetched genders.");
  } catch (error) {
    console.error("Error fetching genders:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// CREATE new product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      sizes,
      colors,
      gender,
      stock_quantity,
      category_id,
      cloudinary_public_id,
    } = req.body;

    // Validation
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        error: "Name and price are required",
      });
    }

    const result = await db.query(
      `
      INSERT INTO products (name, description, price, sizes, colors, gender, stock_quantity, category_id, cloudinary_public_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        name,
        description || null,
        price,
        JSON.stringify(sizes || []),
        JSON.stringify(colors || []),
        gender || "unisex",
        stock_quantity || 0,
        category_id || null,
        cloudinary_public_id || null,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// UPDATE product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      sizes,
      colors,
      gender,
      stock_quantity,
      category_id,
      cloudinary_public_id,
    } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID",
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (sizes !== undefined) {
      updates.push(`sizes = $${paramCount++}`);
      values.push(JSON.stringify(sizes));
    }
    if (colors !== undefined) {
      updates.push(`colors = $${paramCount++}`);
      values.push(JSON.stringify(colors));
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramCount++}`);
      values.push(gender);
    }
    if (stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${paramCount++}`);
      values.push(stock_quantity);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }
    if (cloudinary_public_id !== undefined) {
      updates.push(`cloudinary_public_id = $${paramCount++}`);
      values.push(cloudinary_public_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    values.push(id);
    const query = `
      UPDATE products 
      SET ${updates.join(", ")}
      WHERE product_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// DELETE product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID",
      });
    }

    const result = await db.query(
      "DELETE FROM products WHERE product_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// SEARCH products
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const result = await db.query(
      `
      SELECT * FROM products 
      WHERE name ILIKE $1 OR description ILIKE $1
      ORDER BY product_id
    `,
      [`%${q}%`]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    if (isNaN(category_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid category ID",
      });
    }

    const result = await db.query(
      "SELECT * FROM products WHERE category_id = $1 ORDER BY product_id",
      [category_id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getGenders,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
};
