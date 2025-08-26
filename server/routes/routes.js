const express = require('express');
const router = express.Router();
const { getItems,getItemById, postItem, updateItem, deleteItem } = require('../controllers/handlers');

// GET all items
router.get('/items', getItems);

// Get By ID
router.get('/items/:id',getItemById);

// POST a new item
router.post('/items', postItem);

// UPDATE an item by ID
router.put('/items/:id', updateItem);

// DELETE an item by ID
router.delete('/items/:id', deleteItem);

module.exports = router;
