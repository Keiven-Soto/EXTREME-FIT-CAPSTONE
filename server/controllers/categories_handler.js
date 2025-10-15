const db = require("../config/database");

// GET all categories
const getCategories = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
      category_id,
      name,
      type
      FROM categories 
    `);

    res.json({
      success: true,
      data: result.rows,
    });

    console.log("✅ Fetched categories.");
  } catch (error) {
    console.error(" ❌ Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getCategoriesByGender = async (req, res) => {
  try {
    const { gender } = req.params;

    if (!gender || typeof gender !== "string") {
      return res.status(400).json({ error: "Invalid gender" });
    }

    const result = await db.query(
      `
      SELECT DISTINCT
      T2.category_id,
      T1.name,
      T2.gender,
      COUNT(*)
      FROM categories T1
      JOIN products T2 ON T1.category_id = T2.category_id
      WHERE gender = $1
      group by T2.gender, T1.name, T2.category_id
    `,
      [gender]
    );

    res.json({
      success: true,
      data: result.rows,
    });
    console.log("✅ Fetched filtered categories.");
  } catch (error) {
    console.error("❌ Error fetching filtered categories:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  getCategoriesByGender,
};
