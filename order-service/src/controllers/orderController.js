const { Order, OrderItem, SagaState, ORDER_STATUS } = require('../models');
const { sagaOrchestrator } = require('../saga/SagaOrchestrator');
const { formatOrderResponse } = require('../middleware/idempotencyMiddleware');
const { logger } = require('../config/logger');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

/**
 * Order Controller
 * Production-ready handlers for order operations
 */
class OrderController {
    /**
     * POST /api/orders
     * Create a new order - Initiates Saga Orchestration
     */
    async createOrder(req, res, next) {
        const controllerLogger = logger.child({
            correlationId: req.correlationId,
            action: 'createOrder'
        });

        try {
            const { userId, items, shippingAddress, paymentDetails } = req.body;
            const idempotencyKey = req.idempotencyKey;

            controllerLogger.info('Creating order', {
                userId,
                itemCount: items?.length,
                idempotencyKey
            });

            // Execute Saga
            const result = await sagaOrchestrator.executeSaga({
                userId,
                items,
                shippingAddress,
                paymentDetails,
                idempotencyKey
            }, req.correlationId);

            if (!result.success) {
                controllerLogger.warn('Order creation failed', {
                    error: result.error,
                    message: result.message
                });

                if (result.error === 'STOCK_VALIDATION_FAILED') {
                    throw new ConflictError(result.message, result.details);
                }
                throw new Error(result.message);
            }

            // Return created order
            const responseStatus = result.isExisting ? 200 : 201;

            controllerLogger.info('Order created successfully', {
                orderId: result.order.id,
                isExisting: result.isExisting
            });

            return res.status(responseStatus).json({
                success: true,
                message: result.isExisting ? 'Order already exists' : 'Order created successfully',
                order: formatOrderResponse(result.order),
                sagaId: result.sagaId,
                nextStep: result.nextStep,
                correlationId: req.correlationId
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/orders/:orderId
     * Get order details by ID
     */
    async getOrderById(req, res, next) {
        try {
            const { orderId } = req.params;

            const order = await Order.findByPk(orderId, {
                include: [
                    { model: OrderItem, as: 'items' },
                    { model: SagaState, as: 'sagaState' }
                ]
            });

            if (!order) {
                throw new NotFoundError('Order', orderId);
            }

            // Check ownership (unless admin)
            if (req.user?.role !== 'admin' && order.userId !== req.user?.id) {
                throw new NotFoundError('Order', orderId); // Don't reveal existence
            }

            return res.status(200).json({
                success: true,
                order: {
                    ...formatOrderResponse(order),
                    saga: order.sagaState ? {
                        currentStep: order.sagaState.currentStep,
                        completedSteps: order.sagaState.completedSteps,
                        compensationRequired: order.sagaState.compensationRequired
                    } : null
                },
                correlationId: req.correlationId
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/orders/user/:userId
     * Get all orders for a user
     */
    async getOrdersByUserId(req, res, next) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 10, status } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);

            // Build where clause
            const whereClause = { userId: parseInt(userId) };
            if (status && ORDER_STATUS[status]) {
                whereClause.status = status;
            }

            const { count, rows: orders } = await Order.findAndCountAll({
                where: whereClause,
                include: [{ model: OrderItem, as: 'items' }],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset
            });

            return res.status(200).json({
                success: true,
                orders: orders.map(formatOrderResponse),
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / parseInt(limit))
                },
                correlationId: req.correlationId
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/orders/:orderId/status
     * Update order status (admin only)
     */
    async updateOrderStatus(req, res, next) {
        try {
            const { orderId } = req.params;
            const { status, reason } = req.body;

            const order = await Order.findByPk(orderId);

            if (!order) {
                throw new NotFoundError('Order', orderId);
            }

            try {
                await order.updateStatus(status, reason);

                logger.info('Order status updated', {
                    correlationId: req.correlationId,
                    orderId,
                    newStatus: status,
                    updatedBy: req.user?.id
                });

                return res.status(200).json({
                    success: true,
                    message: `Order status updated to ${status}`,
                    order: {
                        id: order.id,
                        status: order.status,
                        statusHistory: order.statusHistory
                    },
                    correlationId: req.correlationId
                });
            } catch (transitionError) {
                throw new ValidationError(transitionError.message);
            }

        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/orders/:orderId
     * Cancel an order
     */
    async cancelOrder(req, res, next) {
        try {
            const { orderId } = req.params;
            const { reason } = req.body;

            const order = await Order.findByPk(orderId);

            if (!order) {
                throw new NotFoundError('Order', orderId);
            }

            // Check ownership (unless admin)
            if (req.user?.role !== 'admin' && order.userId !== req.user?.id) {
                throw new NotFoundError('Order', orderId);
            }

            if (!order.canCancel()) {
                throw new ValidationError(`Order in status ${order.status} cannot be cancelled`);
            }

            await order.updateStatus(ORDER_STATUS.CANCELLED, reason || 'User requested cancellation');

            logger.info('Order cancelled', {
                correlationId: req.correlationId,
                orderId,
                cancelledBy: req.user?.id,
                reason
            });

            return res.status(200).json({
                success: true,
                message: 'Order cancelled successfully',
                order: {
                    id: order.id,
                    status: order.status
                },
                correlationId: req.correlationId
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/orders/:orderId/pay
     * Mock payment endpoint - fails 30% of the time for testing saga rollback
     */
    async processPayment(req, res, next) {
        const controllerLogger = logger.child({
            correlationId: req.correlationId,
            action: 'processPayment'
        });

        try {
            const { orderId } = req.params;

            const order = await Order.findByPk(orderId, {
                include: [{ model: OrderItem, as: 'items' }]
            });

            if (!order) {
                throw new NotFoundError('Order', orderId);
            }

            if (order.status !== ORDER_STATUS.PAYMENT_PENDING) {
                throw new ValidationError(`Order is not awaiting payment. Current status: ${order.status}`);
            }

            controllerLogger.info('Processing payment', {
                orderId,
                amount: order.totalAmount
            });

            // Mock payment: 30% failure rate
            const paymentFails = Math.random() < 0.30;

            if (paymentFails) {
                controllerLogger.warn('Payment failed (mock)', { orderId });

                // Trigger saga compensation
                const sagaState = await SagaState.findOne({ where: { orderId } });
                await sagaOrchestrator.compensate(order, sagaState, new Error('Payment declined'), controllerLogger);

                return res.status(402).json({
                    success: false,
                    error: 'PAYMENT_FAILED',
                    message: 'Payment was declined (mock failure for testing)',
                    order: {
                        id: order.id,
                        status: order.status
                    },
                    correlationId: req.correlationId
                });
            }

            // Payment success
            await order.updateStatus(ORDER_STATUS.PAID);
            await order.updateStatus(ORDER_STATUS.CONFIRMED);

            controllerLogger.info('Payment successful', { orderId });

            return res.status(200).json({
                success: true,
                message: 'Payment processed successfully',
                order: formatOrderResponse(await order.reload({ include: [{ model: OrderItem, as: 'items' }] })),
                correlationId: req.correlationId
            });

        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
const orderController = new OrderController();

module.exports = orderController;
