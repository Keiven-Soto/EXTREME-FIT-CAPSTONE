const db = require('../config/database');

const getProducts = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        product_id,
        name,
        description,
        price,
        category_id,
        stock_quantity,
        image_url,
        cloudinary_public_id,
        sizes,
        colors,
        gender
      FROM products
      ORDER BY product_id DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const result = await db.query(`
      SELECT
        product_id,
        name,
        description,
        price,
        category_id,
        stock_quantity,
        image_url,
        cloudinary_public_id,
        sizes,
        colors,
        gender
      FROM products
      WHERE product_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      category_id, 
      stock_quantity = 0,
      image_url,
      cloudinary_public_id,
      sizes,
      colors,
      gender = 'unisex'
    } = req.body;

    // Validation
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const result = await db.query(`
      INSERT INTO products (name, description, price, category_id, stock_quantity, image_url, cloudinary_public_id, sizes, colors, gender)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [name, description, price, category_id, stock_quantity, image_url, cloudinary_public_id, sizes, colors, gender]);

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Build dynamic update query
    const allowedFields = ['name', 'description', 'price', 'category_id', 'stock_quantity', 'image_url', 'cloudinary_public_id', 'sizes', 'colors', 'gender'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);

    const query = `
      UPDATE products 
      SET ${updateFields.join(', ')} 
      WHERE product_id = $${paramCount} 
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const result = await db.query(`
      DELETE FROM products 
      WHERE product_id = $1 
      RETURNING product_id, name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product deleted successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    if (isNaN(category_id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const result = await db.query(`
      SELECT
        product_id,
        name,
        description,
        price,
        category_id,
        stock_quantity,
        image_url,
        cloudinary_public_id,
        sizes,
        colors,
        gender
      FROM products
      WHERE category_id = $1
      ORDER BY name ASC
    `, [category_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: error.message });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await db.query(`
      SELECT * FROM products 
      WHERE name ILIKE $1 OR description ILIKE $1
      ORDER BY name ASC
    `, [`%${q}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductsByCategory,
  searchProducts  
};