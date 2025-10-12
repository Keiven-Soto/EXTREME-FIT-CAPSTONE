const db = require('../config/database');

// GET cart items by user ID
const getCart = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            `SELECT c.cart_id, c.product_id, c.quantity, c.added_at,
                    p.name, p.price, p.cloudinary_public_id,
                    c.size, c.color
             FROM cart c
             JOIN products p ON c.product_id = p.product_id
             WHERE c.user_id = $1
             ORDER BY c.added_at DESC`,
            [userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST add item to cart
const addItemToCart = async (req, res) => {
    const { userId, productId, quantity, size, color } = req.body;
    try {
        // Verifica si el producto con la talla y color ya existe en el carrito
        const exists = await db.query(
            'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4',
            [userId, productId, size, color]
        );
        if (exists.rows.length > 0) {
            const newQty = (exists.rows[0].quantity || 0) + (quantity || 1);
            await db.query(
                'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3 AND size = $4 AND color = $5',
                [newQty, userId, productId, size, color]
            );
            return res.json({ success: true, message: 'Cantidad actualizada en el carrito' });
        }
        // Si no existe, lo agrega
        await db.query(
            'INSERT INTO cart (user_id, product_id, quantity, size, color) VALUES ($1, $2, $3, $4, $5)',
            [userId, productId, quantity || 1, size, color]
        );
        res.json({ success: true, message: 'Producto agregado al carrito' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// DELETE remove item from cart
const removeItemFromCart = async (req, res) => {
	const { userId, productId } = req.body;
	try {
		await db.query(
			'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
			[userId, productId]
		);
		res.json({ success: true, message: 'Producto eliminado del carrito' });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// PUT update cart item quantity
const updateCartItemQuantity = async (req, res) => {
	const { userId, productId, quantity } = req.body;
	try {
		await db.query(
			'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
			[quantity, userId, productId]
		);
		res.json({ success: true, message: 'Cantidad actualizada' });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};


// DELETE clear all items from cart for a user
const clearCart = async (req, res) => {
    const { userId } = req.params;
    try {
        await db.query('DELETE FROM cart WHERE user_id = $1', [userId]);
        res.json({ success: true, message: 'Carrito vaciado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getCart,
    addItemToCart,
    removeItemFromCart,
    updateCartItemQuantity,
    clearCart
};