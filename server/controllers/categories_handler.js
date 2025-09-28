const db = require("../config/database");

// GET all categories
const getCategories = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        category_id,
        name, 
        type, 
        gender 
      FROM categories 
      ORDER BY category_id DESC
    `);

    res.json(result.rows);
    console.log("Fetched categories:", result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getCategories };