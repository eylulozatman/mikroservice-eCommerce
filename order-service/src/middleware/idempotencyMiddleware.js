const { Order, OrderItem, ORDER_STATUS } = require('../models');

/**
 * Idempotency Middleware
 * Prevents duplicate order creation when the same Idempotency-Key header is sent
 * Essential for reliable order processing in distributed systems
 */
const idempotencyMiddleware = async (req, res, next) => {
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

    // Only apply to POST requests
    if (req.method !== 'POST') {
        return next();
    }

    // Idempotency key is required for POST /orders
    if (!idempotencyKey) {
        return res.status(400).json({
            success: false,
            error: 'MISSING_IDEMPOTENCY_KEY',
            message: 'Idempotency-Key header is required for order creation',
            hint: 'Generate a UUID v4 and send it as Idempotency-Key header'
        });
    }

    // Validate idempotency key format (should be UUID-like)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey) && idempotencyKey.length < 10) {
        return res.status(400).json({
            success: false,
            error: 'INVALID_IDEMPOTENCY_KEY',
            message: 'Idempotency-Key should be a UUID or unique string (min 10 chars)'
        });
    }

    try {
        // Check if an order with this idempotency key already exists
        const existingOrder = await Order.findOne({
            where: { idempotencyKey },
            include: [{ model: OrderItem, as: 'items' }]
        });

        if (existingOrder) {
            // Return cached response
            console.log(`🔄 Returning cached order for idempotency key: ${idempotencyKey}`);

            return res.status(200).json({
                success: true,
                message: 'Order already exists (idempotent response)',
                isIdempotent: true,
                order: formatOrderResponse(existingOrder)
            });
        }

        // Attach idempotency key to request for later use
        req.idempotencyKey = idempotencyKey;
        next();

    } catch (error) {
        console.error('Idempotency check error:', error);
        next(error);
    }
};

/**
 * Format order for API response
 * @param {Object} order - Order model instance
 * @returns {Object} - Formatted response
 */
const formatOrderResponse = (order) => {
    return {
        id: order.id,
        userId: order.userId,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        items: order.items?.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice)
        })) || [],
        shippingAddress: order.shippingAddress,
        statusHistory: order.statusHistory,
        createdAt: order.created_at || order.createdAt,
        updatedAt: order.updated_at || order.updatedAt
    };
};

module.exports = {
    idempotencyMiddleware,
    formatOrderResponse
};
