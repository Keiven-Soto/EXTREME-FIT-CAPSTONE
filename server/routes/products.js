const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductsByCategory,
  searchProducts
} = require('../controllers/product_handler');

// GET routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/category/:category_id', getProductsByCategory);
router.get('/:id', getProductById);

// POST routes
router.post('/', createProduct);

// PUT routes
router.put('/:id', updateProduct);

// DELETE routes
router.delete('/:id', deleteProduct);

module.exports = router;