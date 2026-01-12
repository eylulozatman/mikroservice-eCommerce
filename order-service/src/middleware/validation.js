const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Validation result handler middleware
 * Must be called after express-validator checks
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorDetails = errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
        }));

        throw new ValidationError('Validation failed', errorDetails);
    }
    next();
};

/**
 * Create Order Validation Rules
 */
const createOrderValidation = [
    body('userId')
        .isInt({ min: 1 })
        .withMessage('userId must be a positive integer'),

    body('items')
        .isArray({ min: 1 })
        .withMessage('items must be a non-empty array'),

    body('items.*.productId')
        .isInt({ min: 1 })
        .withMessage('Each item must have a valid productId'),

    body('items.*.quantity')
        .isInt({ min: 1, max: 100 })
        .withMessage('Quantity must be between 1 and 100'),

    body('items.*.unitPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a positive number'),

    body('shippingAddress')
        .optional()
        .isObject()
        .withMessage('shippingAddress must be an object'),

    body('shippingAddress.city')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be 2-100 characters'),

    body('shippingAddress.street')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Street must be less than 200 characters'),

    body('shippingAddress.zipCode')
        .optional()
        .isString()
        .trim()
        .matches(/^[A-Za-z0-9\s-]{3,10}$/)
        .withMessage('Invalid zip code format'),

    body('paymentDetails')
        .optional()
        .isObject()
        .withMessage('paymentDetails must be an object'),

    body('paymentDetails.method')
        .optional()
        .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer'])
        .withMessage('Invalid payment method'),

    handleValidationErrors
];

/**
 * Get Order by ID Validation
 */
const getOrderValidation = [
    param('orderId')
        .isUUID(4)
        .withMessage('orderId must be a valid UUID'),

    handleValidationErrors
];

/**
 * Get User Orders Validation
 */
const getUserOrdersValidation = [
    param('userId')
        .isInt({ min: 1 })
        .withMessage('userId must be a positive integer'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit must be between 1 and 100'),

    query('status')
        .optional()
        .isIn(['PENDING', 'STOCK_RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FAILED', 'CANCELLED', 'REVERSED'])
        .withMessage('Invalid order status'),

    handleValidationErrors
];

/**
 * Update Order Status Validation
 */
const updateStatusValidation = [
    param('orderId')
        .isUUID(4)
        .withMessage('orderId must be a valid UUID'),

    body('status')
        .isIn(['PENDING', 'STOCK_RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FAILED', 'CANCELLED', 'REVERSED'])
        .withMessage('Invalid order status'),

    body('reason')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reason must be less than 500 characters'),

    handleValidationErrors
];

/**
 * Cancel Order Validation
 */
const cancelOrderValidation = [
    param('orderId')
        .isUUID(4)
        .withMessage('orderId must be a valid UUID'),

    body('reason')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reason must be less than 500 characters'),

    handleValidationErrors
];

module.exports = {
    createOrderValidation,
    getOrderValidation,
    getUserOrdersValidation,
    updateStatusValidation,
    cancelOrderValidation,
    handleValidationErrors
};
