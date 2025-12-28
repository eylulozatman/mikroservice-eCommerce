const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Order Status Enum
 * Represents the complete lifecycle of an order in the Saga pattern
 */
const ORDER_STATUS = {
    PENDING: 'PENDING',                 // Initial state after order creation
    STOCK_RESERVED: 'STOCK_RESERVED',   // Inventory confirmed availability
    PAYMENT_PENDING: 'PAYMENT_PENDING', // Waiting for payment confirmation
    PAID: 'PAID',                       // Payment successful
    CONFIRMED: 'CONFIRMED',             // Order finalized
    PROCESSING: 'PROCESSING',           // Order being prepared
    SHIPPED: 'SHIPPED',                 // Order dispatched
    DELIVERED: 'DELIVERED',             // Order completed
    FAILED: 'FAILED',                   // Order failed at any step
    CANCELLED: 'CANCELLED',             // Order cancelled by user
    REVERSED: 'REVERSED'                // Compensation complete
};

/**
 * Order Model
 * Main order entity with state machine tracking
 */
const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id'
    },
    status: {
        type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
        defaultValue: ORDER_STATUS.PENDING,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount'
    },
    shippingAddress: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'shipping_address'
    },
    paymentDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'payment_details'
    },
    idempotencyKey: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'idempotency_key'
    },
    statusHistory: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'status_history'
    },
    failureReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'failure_reason'
    }
}, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeUpdate: (order) => {
            // Track status changes in history
            if (order.changed('status')) {
                const history = order.statusHistory || [];
                history.push({
                    status: order.status,
                    timestamp: new Date().toISOString()
                });
                order.statusHistory = history;
            }
        }
    }
});

/**
 * Instance method: Update order status with validation
 */
Order.prototype.updateStatus = async function (newStatus, reason = null) {
    const validTransitions = {
        [ORDER_STATUS.PENDING]: [ORDER_STATUS.STOCK_RESERVED, ORDER_STATUS.FAILED, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.STOCK_RESERVED]: [ORDER_STATUS.PAYMENT_PENDING, ORDER_STATUS.FAILED, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.PAYMENT_PENDING]: [ORDER_STATUS.PAID, ORDER_STATUS.FAILED, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.PAID]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.FAILED],
        [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.FAILED],
        [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.FAILED],
        [ORDER_STATUS.DELIVERED]: [],
        [ORDER_STATUS.FAILED]: [ORDER_STATUS.REVERSED],
        [ORDER_STATUS.CANCELLED]: [],
        [ORDER_STATUS.REVERSED]: []
    };

    const allowedTransitions = validTransitions[this.status] || [];

    if (!allowedTransitions.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
    }

    this.status = newStatus;
    if (reason) {
        this.failureReason = reason;
    }

    return this.save();
};

/**
 * Check if order can be cancelled
 */
Order.prototype.canCancel = function () {
    return [
        ORDER_STATUS.PENDING,
        ORDER_STATUS.STOCK_RESERVED,
        ORDER_STATUS.PAYMENT_PENDING,
        ORDER_STATUS.CONFIRMED
    ].includes(this.status);
};

module.exports = { Order, ORDER_STATUS };
