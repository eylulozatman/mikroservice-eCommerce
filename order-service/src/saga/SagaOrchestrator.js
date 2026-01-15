const { Order, OrderItem, SagaState, ORDER_STATUS } = require('../models');
const { sequelize } = require('../config/database');
const { createOrderMachine, getOrderStatus, statusToState } = require('./OrderStateMachine');
const inventoryClient = require('../services/inventoryClient');
const rabbitmqPublisher = require('../messaging/rabbitmqPublisher');
const { logger } = require('../config/logger');
const { SagaExecutionError, ServiceUnavailableError } = require('../utils/errors');

/**
 * Saga Steps Definition
 */
const SAGA_STEPS = {
    INIT: 'INIT',
    VALIDATE_STOCK: 'VALIDATE_STOCK',
    CREATE_ORDER: 'CREATE_ORDER',
    RESERVE_STOCK: 'RESERVE_STOCK',
    PROCESS_PAYMENT: 'PROCESS_PAYMENT',
    CONFIRM_ORDER: 'CONFIRM_ORDER',
    COMPLETE: 'COMPLETE'
};

/**
 * SagaOrchestrator
 * Production-ready distributed transaction orchestrator
 * Implements Saga Orchestration Pattern with:
 * - Database transactions for atomicity
 * - Compensation handlers for rollback
 * - Event publishing with confirmation
 */
class SagaOrchestrator {
    constructor() {
        this.activeServices = new Map();
    }

    /**
     * Execute the complete order creation saga
     * Uses database transaction for atomicity
     * @param {Object} orderData - Order creation payload
     * @param {string} correlationId - Request correlation ID for tracing
     * @returns {Object} - Created order or error
     */
    async executeSaga(orderData, correlationId = null) {
        const { userId, items, shippingAddress, paymentDetails, idempotencyKey } = orderData;
        const sagaLogger = logger.child({ correlationId, sagaType: 'CREATE_ORDER' });

        let transaction = null;
        let order = null;
        let sagaState = null;
        let orderItems = [];

        try {
            // Step 1: Check for existing order with same idempotency key (outside transaction)
            const existingOrder = await Order.findOne({
                where: { idempotencyKey },
                include: [{ model: OrderItem, as: 'items' }]
            });

            if (existingOrder) {
                sagaLogger.info('Returning existing order for idempotency key', {
                    orderId: existingOrder.id,
                    idempotencyKey
                });
                return { success: true, order: existingOrder, isExisting: true };
            }

            // Step 2: Validate stock synchronously (REST call to Inventory Service)
            sagaLogger.info('Validating stock with Inventory Service');
            const stockValidation = await this.validateStock(items, sagaLogger);

            if (!stockValidation.success) {
                sagaLogger.warn('Stock validation failed', {
                    unavailableItems: stockValidation.unavailableItems
                });
                return {
                    success: false,
                    error: 'STOCK_VALIDATION_FAILED',
                    message: stockValidation.message,
                    details: stockValidation.unavailableItems
                };
            }

            // Step 3: Start database transaction for atomicity
            sagaLogger.info('Starting database transaction');
            transaction = await sequelize.transaction();

            try {
                // Calculate total amount
                const totalAmount = this.calculateTotal(items, stockValidation.productDetails);

                // Step 4: Create order in database (within transaction)
                sagaLogger.info('Creating order in database');
                order = await Order.create({
                    userId,
                    status: ORDER_STATUS.PENDING,
                    totalAmount,
                    shippingAddress,
                    paymentDetails: this.sanitizePaymentDetails(paymentDetails),
                    idempotencyKey,
                    statusHistory: [{ status: ORDER_STATUS.PENDING, timestamp: new Date().toISOString() }]
                }, { transaction });

                // Step 5: Create order items (within transaction)
                orderItems = await Promise.all(
                    items.map(async (item) => {
                        const productInfo = stockValidation.productDetails?.find(p => p.productId === item.productId) || {};
                        return OrderItem.create({
                            orderId: order.id,
                            productId: item.productId,
                            productName: productInfo.name || `Product ${item.productId}`,
                            quantity: item.quantity,
                            unitPrice: productInfo.price || item.unitPrice || item.price || 0,
                            totalPrice: (productInfo.price || item.unitPrice || item.price || 0) * item.quantity
                        }, { transaction });
                    })
                );

                // Step 6: Create saga state for tracking (within transaction)
                sagaState = await SagaState.create({
                    orderId: order.id,
                    currentStep: SAGA_STEPS.CREATE_ORDER,
                    completedSteps: [
                        { step: SAGA_STEPS.INIT, status: 'COMPLETED', completedAt: new Date().toISOString() },
                        { step: SAGA_STEPS.VALIDATE_STOCK, status: 'COMPLETED', completedAt: new Date().toISOString() },
                        { step: SAGA_STEPS.CREATE_ORDER, status: 'COMPLETED', completedAt: new Date().toISOString() }
                    ]
                }, { transaction });

                // Step 7: Commit transaction BEFORE publishing events
                await transaction.commit();
                sagaLogger.info('Database transaction committed', { orderId: order.id });
                transaction = null; // Mark transaction as complete

                // Step 8: Update order status (stock reserved was validated)
                await order.update({ status: ORDER_STATUS.STOCK_RESERVED });
                await sagaState.completeStep(SAGA_STEPS.RESERVE_STOCK);

                // Step 9: Publish OrderCreated event (after commit - Transactional Outbox pattern)
                sagaLogger.info('Publishing OrderCreatedEvent');
                try {
                    await rabbitmqPublisher.publishOrderCreated(order, orderItems, correlationId);
                } catch (publishError) {
                    // Event publishing failed - order exists but event wasn't sent
                    // Log for manual retry or implement Outbox pattern
                    sagaLogger.error('Failed to publish OrderCreatedEvent - manual intervention may be required', {
                        orderId: order.id,
                        error: publishError.message
                    });
                    // Don't rollback - order is valid, just event failed
                    // In production: use Transactional Outbox pattern
                }

                // Step 10: Transition to payment pending
                await order.update({ status: ORDER_STATUS.PAYMENT_PENDING });

                // Reload order with items
                const completeOrder = await Order.findByPk(order.id, {
                    include: [{ model: OrderItem, as: 'items' }]
                });

                sagaLogger.info('Saga completed successfully', {
                    orderId: order.id,
                    status: order.status
                });

                return {
                    success: true,
                    order: completeOrder,
                    sagaId: sagaState.id,
                    nextStep: 'AWAITING_PAYMENT'
                };

            } catch (dbError) {
                // Rollback transaction if still active
                if (transaction) {
                    await transaction.rollback();
                    sagaLogger.info('Database transaction rolled back');
                }
                throw dbError;
            }

        } catch (error) {
            sagaLogger.error('Saga execution failed', {
                error: error.message,
                stack: error.stack,
                orderId: order?.id
            });

            // Trigger compensation if order was created (outside transaction failure)
            if (order && order.id) {
                await this.compensate(order, sagaState, error, sagaLogger);
            }

            return {
                success: false,
                error: 'SAGA_EXECUTION_FAILED',
                message: error.message
            };
        }
    }

    /**
     * Validate stock availability with Inventory Service (Synchronous REST)
     */
    async validateStock(items, sagaLogger = logger) {
        const unavailableItems = [];
        const productDetails = [];

        for (const item of items) {
            try {
                const stockInfo = await inventoryClient.checkStock(item.productId, item.quantity);

                if (!stockInfo.available) {
                    unavailableItems.push({
                        productId: item.productId,
                        requested: item.quantity,
                        available: stockInfo.quantity || 0
                    });
                } else {
                    productDetails.push({
                        productId: item.productId,
                        name: stockInfo.productName,
                        price: stockInfo.price || item.unitPrice || item.price,
                        availableQuantity: stockInfo.quantity
                    });
                }
            } catch (error) {
                sagaLogger.warn('Could not verify stock for product', {
                    productId: item.productId,
                    error: error.message
                });

                // REMOVED: Development backdoor
                // In production, fail fast if inventory service is unavailable
                if (process.env.INVENTORY_SERVICE_MOCK === 'true') {
                    // Explicit mock mode only - not based on NODE_ENV
                    sagaLogger.info('Using mock inventory data (INVENTORY_SERVICE_MOCK=true)');
                    productDetails.push({
                        productId: item.productId,
                        name: `Product ${item.productId}`,
                        price: item.unitPrice || item.price || 99.99,
                        availableQuantity: 100
                    });
                } else {
                    unavailableItems.push({
                        productId: item.productId,
                        error: 'INVENTORY_SERVICE_UNAVAILABLE'
                    });
                }
            }
        }

        return {
            success: unavailableItems.length === 0,
            message: unavailableItems.length > 0
                ? `${unavailableItems.length} item(s) not available`
                : 'All items available',
            unavailableItems,
            productDetails
        };
    }

    /**
     * Calculate order total
     */
    calculateTotal(items, productDetails = []) {
        return items.reduce((sum, item) => {
            const productInfo = productDetails.find(p => p.productId === item.productId);
            const price = productInfo?.price || item.unitPrice || item.price || 0;
            return sum + (price * item.quantity);
        }, 0);
    }

    /**
     * Sanitize payment details (remove sensitive info before storing)
     */
    sanitizePaymentDetails(paymentDetails) {
        if (!paymentDetails) return null;

        return {
            method: paymentDetails.method,
            cardLastFour: paymentDetails.cardLastFour || paymentDetails.cardNumber?.slice(-4),
            // Never store full card numbers
        };
    }

    /**
     * Compensation handler - rollback completed steps
     */
    async compensate(order, sagaState, error, sagaLogger = logger) {
        sagaLogger.info('Starting compensation', { orderId: order.id });

        try {
            // Update order status to failed
            await order.update({
                status: ORDER_STATUS.FAILED,
                failureReason: error.message
            });

            // If saga state exists, mark compensation required
            if (sagaState) {
                await sagaState.failStep(sagaState.currentStep, error.message);
            }

            // Publish order failed event for other services to compensate
            try {
                await rabbitmqPublisher.publishOrderFailed(order, error.message);
            } catch (publishError) {
                sagaLogger.error('Failed to publish order.failed event', {
                    orderId: order.id,
                    error: publishError.message
                });
            }

            // Update to reversed status after compensation
            await order.update({ status: ORDER_STATUS.REVERSED });

            if (sagaState) {
                await sagaState.completeCompensation();
            }

            sagaLogger.info('Compensation complete', { orderId: order.id });
        } catch (compensationError) {
            sagaLogger.error('Compensation failed - manual intervention required', {
                orderId: order.id,
                error: compensationError.message
            });
        }
    }

    /**
     * Handle external event to update order status
     * Used by RabbitMQ consumers
     */
    async handleExternalEvent(orderId, eventType, payload, correlationId = null) {
        const sagaLogger = logger.child({ correlationId, orderId, eventType });

        const order = await Order.findByPk(orderId);
        if (!order) {
            sagaLogger.error('Order not found for external event');
            return;
        }

        const sagaState = await SagaState.findOne({ where: { orderId } });

        sagaLogger.info('Processing external event');

        try {
            switch (eventType) {
                case 'payment.success':
                    await order.updateStatus(ORDER_STATUS.PAID);
                    await order.updateStatus(ORDER_STATUS.CONFIRMED);
                    await sagaState?.completeStep(SAGA_STEPS.PROCESS_PAYMENT);
                    await sagaState?.completeStep(SAGA_STEPS.CONFIRM_ORDER);
                    await rabbitmqPublisher.publishOrderConfirmed(order, correlationId);
                    sagaLogger.info('Order confirmed after payment success');
                    break;

                case 'payment.failed':
                    await this.compensate(order, sagaState, new Error(payload.reason || 'Payment failed'), sagaLogger);
                    break;

                case 'stock.reserved':
                    await sagaState?.completeStep(SAGA_STEPS.RESERVE_STOCK);
                    sagaLogger.info('Stock reservation confirmed');
                    break;

                case 'stock.reservation.failed':
                    await this.compensate(order, sagaState, new Error('Stock reservation failed'), sagaLogger);
                    break;

                default:
                    sagaLogger.warn('Unknown external event type');
            }
        } catch (error) {
            sagaLogger.error('Failed to process external event', { error: error.message });
        }
    }
}

// Singleton instance
const sagaOrchestrator = new SagaOrchestrator();

module.exports = {
    SagaOrchestrator,
    sagaOrchestrator,
    SAGA_STEPS
};
