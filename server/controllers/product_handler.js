// Lazily resolve DB so tests can inject a mock into global.__DB_MOCK__
const getDb = () => (global && global.__DB_MOCK__) ? global.__DB_MOCK__ : require("../config/database");

// ============================================
// HELPER FUNCTIONS FOR FUZZY SEARCH
// ============================================

/**
 * Levenshtein Distance Algorithm
 * Calculates the minimum number of single-character edits needed
 * to change one word into another (typo tolerance)
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,           // deletion
        matrix[j - 1][i] + 1,           // insertion
        matrix[j - 1][i - 1] + cost     // substitution
      );
    }
  }

  return matrix[len2][len1];
}

/**
 * Calculate similarity score (0-1, higher is better)
 */
function calculateSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLen);
}

/**
 * Check if query matches any color in the colors array
 */
function matchesColor(colorsArray, query) {
  if (!colorsArray || !Array.isArray(colorsArray)) return { matches: false, score: 0 };
  
  let bestScore = 0;
  for (const color of colorsArray) {
    const score = calculateSimilarity(query, color);
    if (score > bestScore) {
      bestScore = score;
    }
  }
  
  return { matches: bestScore > 0.6, score: bestScore };
}

// ============================================
// EXISTING FUNCTIONS (UNCHANGED)
// ============================================

// GET all products
const getProducts = async (req, res) => {
  try {
    const result = await getDb().query("SELECT * FROM products ORDER BY product_id");

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

    const result = await getDb().query(
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
    const result = await getDb().query(`
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

    const result = await getDb().query(
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

    const result = await getDb().query(query, values);

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

    const result = await getDb().query(
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

// SEARCH products - FUZZY SEARCH WITH PREFIX MATCHING
const searchProducts = async (req, res) => {
  try {
    const { q, gender, color } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const searchQuery = q.toLowerCase().trim();
    const threshold = 0.3;

    // Split search query into individual words
    const searchWords = searchQuery.split(/[\s-]+/).filter(word => word.length > 0);

    // Define common color words
    const colorKeywords = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 
                           'pink', 'gray', 'grey', 'navy', 'orange', 'brown'];
    
    // Define product type keywords
    const productTypeKeywords = ['hoodie', 'shirt', 'cap', 'hat', 'leggings', 'legging', 
                                 'shorts', 'short', 'jogger', 'bra', 'socks', 'sock'];

    // Identify colors and product types in search
    const detectedColors = [];
    const detectedProductTypes = [];
    
    searchWords.forEach(word => {
      // Check if it's a color (strict matching - 75% threshold)
      colorKeywords.forEach(colorKey => {
        if (calculateSimilarity(word, colorKey) >= 0.75) {
          if (!detectedColors.includes(colorKey)) {
            detectedColors.push(colorKey);
          }
        }
      });
      
      // Check if it's a product type with multiple strategies
      productTypeKeywords.forEach(typeKey => {
        const similarity = calculateSimilarity(word, typeKey);
        
        // Strategy 1: Fuzzy matching (60% threshold for typos like "haadie" → "hoodie")
        if (similarity >= 0.60) {
          if (!detectedProductTypes.includes(typeKey)) {
            detectedProductTypes.push(typeKey);
          }
        }
        
        // Strategy 2: Prefix matching (for short queries like "l" → "leggings", "leg" → "leggings")
        if (word.length >= 1 && typeKey.startsWith(word)) {
          if (!detectedProductTypes.includes(typeKey)) {
            detectedProductTypes.push(typeKey);
          }
        }
      });
    });
    
    const hasColorFilter = detectedColors.length > 0;
    const hasProductTypeFilter = detectedProductTypes.length > 0;

    // Get all products
    const result = await getDb().query("SELECT * FROM products");
    const allProducts = result.rows;

    // Apply STRICT filtering
    const scoredProducts = allProducts.map(product => {
      const productName = (product.name || '').toLowerCase();
      const productDesc = (product.description || '').toLowerCase();
      const productColors = product.colors || [];
      const productGender = (product.gender || '').toLowerCase();
      
      const nameWords = productName.split(/[\s-]+/).filter(w => w.length > 0);
      const descWords = productDesc.split(/[\s-]+/).filter(w => w.length > 0);
      
      // === STRICT FILTERING ===
      
      // 1. CHECK PRODUCT TYPE (REQUIRED if specified)
      if (hasProductTypeFilter) {
        const productTypeMatches = detectedProductTypes.some(typeWord => {
          // Check if any product name word matches the detected type (fuzzy or prefix)
          return nameWords.some(nameWord => {
            // Fuzzy match (for typos)
            if (calculateSimilarity(typeWord, nameWord) >= 0.75) {
              return true;
            }
            // Prefix match (for partial words like "leg" → "leggings")
            if (nameWord.startsWith(typeWord)) {
              return true;
            }
            return false;
          });
        });
        
        if (!productTypeMatches) {
          return {
            ...product,
            match_score: 0,
            matched_field: 'none',
            matched_words: 0,
            exact_matches: 0,
            total_search_words: searchWords.length,
            excluded: true,
            reason: 'product_type_mismatch'
          };
        }
      }
      
      // 2. CHECK COLOR (REQUIRED if specified)
      if (hasColorFilter) {
        const colorMatches = detectedColors.some(colorWord => {
          return productColors.some(productColor => 
            calculateSimilarity(colorWord, productColor.toLowerCase()) >= 0.75
          );
        });
        
        if (!colorMatches) {
          return {
            ...product,
            match_score: 0,
            matched_field: 'none',
            matched_words: 0,
            exact_matches: 0,
            total_search_words: searchWords.length,
            excluded: true,
            reason: 'color_mismatch'
          };
        }
      }
      
      // === SCORING (Only for products that passed filters) ===
      let totalScore = 0;
      let matchCount = 0;
      let exactMatchCount = 0;
      
      searchWords.forEach(searchWord => {
        let bestMatchForThisWord = 0;
        
        // Check name words with FUZZY + PREFIX matching
        nameWords.forEach(nameWord => {
          // Standard fuzzy similarity
          const similarity = calculateSimilarity(searchWord, nameWord);
          if (similarity > bestMatchForThisWord) {
            bestMatchForThisWord = similarity;
          }
          
          // PREFIX BOOST: If name word starts with search word, give high score
          // This makes "l" match "leggings", "leg" match "leggings", etc.
          if (nameWord.startsWith(searchWord)) {
            bestMatchForThisWord = Math.max(bestMatchForThisWord, 0.95); // Very high score for prefix match
          }
        });
        
        // Check colors
        productColors.forEach(colorValue => {
          const similarity = calculateSimilarity(searchWord, colorValue.toLowerCase());
          if (similarity > bestMatchForThisWord) {
            bestMatchForThisWord = similarity;
          }
        });
        
        // Check description words with PREFIX matching too
        descWords.forEach(descWord => {
          const similarity = calculateSimilarity(searchWord, descWord);
          if (similarity > bestMatchForThisWord) {
            bestMatchForThisWord = similarity;
          }
          
          // PREFIX BOOST for description too
          if (descWord.startsWith(searchWord)) {
            bestMatchForThisWord = Math.max(bestMatchForThisWord, 0.95);
          }
        });
        
        if (bestMatchForThisWord > 0.5) {
          totalScore += bestMatchForThisWord;
          matchCount++;
          
          if (bestMatchForThisWord >= 0.9) {
            exactMatchCount++;
          }
        }
      });
      
      let finalScore = matchCount > 0 ? (totalScore / searchWords.length) : 0;
      
      // Boost perfect matches
      if (exactMatchCount === searchWords.length && matchCount === searchWords.length) {
        finalScore = finalScore * 2.0;
      } else if (matchCount === searchWords.length) {
        finalScore = finalScore * 1.5;
      } else if (matchCount >= searchWords.length * 0.75) {
        finalScore = finalScore * 1.2;
      }
      
      finalScore = Math.min(finalScore, 1.0);
      
      let matchedField = 'name';
      if (hasColorFilter) {
        matchedField = 'color';
      }

      return {
        ...product,
        match_score: finalScore,
        matched_field: matchedField,
        matched_words: matchCount,
        exact_matches: exactMatchCount,
        total_search_words: searchWords.length,
        excluded: false
      };
    });

    // STRICT FILTER: Remove all excluded products
    let filteredProducts = scoredProducts
      .filter(product => !product.excluded && product.match_score >= threshold)
      .sort((a, b) => {
        if (b.exact_matches !== a.exact_matches) {
          return b.exact_matches - a.exact_matches;
        }
        if (b.matched_words !== a.matched_words) {
          return b.matched_words - a.matched_words;
        }
        return b.match_score - a.match_score;
      });

    // Apply optional filters
    if (gender) {
      filteredProducts = filteredProducts.filter(p => p.gender === gender || p.gender === 'unisex');
    }

    if (color) {
      filteredProducts = filteredProducts.filter(product => {
        const colorMatch = matchesColor(product.colors, color);
        return colorMatch.matches;
      });
    }

    res.json({
      success: true,
      data: filteredProducts,
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

    const result = await getDb().query(
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