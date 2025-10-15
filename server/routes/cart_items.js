const express = require('express');
const router = express.Router();

// Importar handlers (deberás crearlos en controllers/cart_items_handler.js)
const {
	getCart,
	addItemToCart,
	removeItemFromCart,
	updateCartItemQuantity,
	clearCart
} = require('../controllers/cart_items_handler');
// Vaciar el carrito completo de un usuario
router.delete('/cart/clear/:userId', clearCart);

// Obtener los productos del carrito de un usuario
router.get('/cart/:userId', getCart);

// Agregar producto al carrito
router.post('/cart/add', addItemToCart);

// Eliminar producto del carrito
router.delete('/cart/remove', removeItemFromCart);

// Actualizar cantidad de producto en el carrito
router.put('/cart/update', updateCartItemQuantity);

module.exports = router;
