const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { idempotencyMiddleware } = require('../middleware/idempotencyMiddleware');
const { authenticate, checkOwnership, authorize } = require('../middleware/auth');
const {
    createOrderValidation,
    getOrderValidation,
    getUserOrdersValidation,
    updateStatusValidation,
    cancelOrderValidation
} = require('../middleware/validation');

/**
 * Order Routes
 * Production-ready RESTful API with authentication and validation
 */

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Protected - authenticated users only
 * @header  Authorization: Bearer <token>
 * @header  Idempotency-Key: UUID - Required to prevent duplicate orders
 */
router.post('/',
    authenticate,
    idempotencyMiddleware,
    createOrderValidation,
    (req, res, next) => orderController.createOrder(req, res, next)
);

/**
 * @route   GET /:orderId
 * @desc    Get order details by ID
 * @access  Protected - order owner or admin
 */
router.get('/:orderId',
    authenticate,
    getOrderValidation,
    (req, res, next) => orderController.getOrderById(req, res, next)
);

/**
 * @route   GET /user/:userId
 * @desc    Get all orders for a specific user
 * @access  Protected - own orders only (or admin)
 */
router.get('/user/:userId',
    authenticate,
    checkOwnership,
    getUserOrdersValidation,
    (req, res, next) => orderController.getOrdersByUserId(req, res, next)
);

/**
 * @route   PATCH /:orderId/status
 * @desc    Update order status
 * @access  Protected - admin only
 */
router.patch('/:orderId/status',
    authenticate,
    authorize('admin'),
    updateStatusValidation,
    (req, res, next) => orderController.updateOrderStatus(req, res, next)
);

/**
 * @route   DELETE /:orderId
 * @desc    Cancel an order
 * @access  Protected - order owner or admin
 */
router.delete('/:orderId',
    authenticate,
    cancelOrderValidation,
    (req, res, next) => orderController.cancelOrder(req, res, next)
);

/**
 * @route   POST /:orderId/pay
 * @desc    Process payment for order (mock - fails 30% for testing rollback)
 * @access  Protected - order owner
 */
router.post('/:orderId/pay',
    authenticate,
    getOrderValidation,
    (req, res, next) => orderController.processPayment(req, res, next)
);

module.exports = router;
