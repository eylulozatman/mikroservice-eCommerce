const { Order, ORDER_STATUS } = require('./Order');
const { OrderItem } = require('./OrderItem');
const { SagaState, SAGA_STEP_STATUS } = require('./SagaState');

/**
 * Define Model Associations
 */

// Order has many OrderItems
Order.hasMany(OrderItem, {
    foreignKey: 'orderId',
    as: 'items',
    onDelete: 'CASCADE'
});

OrderItem.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order'
});

// Order has one SagaState
Order.hasOne(SagaState, {
    foreignKey: 'orderId',
    as: 'sagaState',
    onDelete: 'CASCADE'
});

SagaState.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order'
});

module.exports = {
    Order,
    OrderItem,
    SagaState,
    ORDER_STATUS,
    SAGA_STEP_STATUS
};
