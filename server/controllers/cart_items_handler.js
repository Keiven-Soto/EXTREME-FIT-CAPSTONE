// Lazily resolve DB so tests can inject a mock into global.__DB_MOCK__
const getDb = () => (global && global.__DB_MOCK__) ? global.__DB_MOCK__ : require('../config/database');

// GET cart items by user ID
const getCart = async (req, res) => {
    const { userId } = req.params;
    console.log('🛒 getCart called for userId:', userId);
    try {
    const result = await getDb().query(
            `SELECT c.cart_id, c.product_id, c.quantity, c.added_at,
                    p.name, p.price, p.cloudinary_public_id,
                    c.size, c.color
             FROM cart c
             JOIN products p ON c.product_id = p.product_id
             WHERE c.user_id = $1
             ORDER BY c.added_at DESC`,
            [userId]
        );
        console.log('✅ Cart items found:', result.rows.length);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('❌ Error in getCart:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to retrieve cart' });
    }
};

// POST add item to cart
const addItemToCart = async (req, res) => {
    const { userId, productId, quantity, size, color } = req.body;
    try {
        // Verifica si el producto con la talla y color ya existe en el carrito
    const exists = await getDb().query(
            'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4',
            [userId, productId, size, color]
        );
        if (exists.rows.length > 0) {
            const newQty = (exists.rows[0].quantity || 0) + (quantity || 1);
            await getDb().query(
                'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3 AND size = $4 AND color = $5',
                [newQty, userId, productId, size, color]
            );
            return res.json({ success: true, message: 'Cantidad actualizada en el carrito' });
        }
        // Si no existe, lo agrega
    await getDb().query(
            'INSERT INTO cart (user_id, product_id, quantity, size, color) VALUES ($1, $2, $3, $4, $5)',
            [userId, productId, quantity || 1, size, color]
        );
        res.json({ success: true, message: 'Producto agregado al carrito' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Failed to add item to cart' });
    }
};

// DELETE remove item from cart
const removeItemFromCart = async (req, res) => {
	const { userId, productId } = req.body;
	try {
    await getDb().query(
			'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
			[userId, productId]
		);
		res.json({ success: true, message: 'Producto eliminado del carrito' });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message || 'Failed to remove item from cart' });
	}
};

// PUT update cart item quantity
const updateCartItemQuantity = async (req, res) => {
	const { userId, productId, quantity } = req.body;
	try {
		await getDb().query(
			'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
			[quantity, userId, productId]
		);
		res.json({ success: true, message: 'Cantidad actualizada' });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message || 'Failed to update quantity' });
	}
};


// DELETE clear all items from cart for a user
const clearCart = async (req, res) => {
    const { userId } = req.params;
    try {
    await getDb().query('DELETE FROM cart WHERE user_id = $1', [userId]);
        res.json({ success: true, message: 'Carrito vaciado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Failed to clear cart' });
    }
};

module.exports = {
    getCart,
    addItemToCart,
    removeItemFromCart,
    updateCartItemQuantity,
    clearCart
};