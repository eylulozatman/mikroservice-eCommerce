const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * OrderItem Model
 * Represents individual products within an order
 */
const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'order_id',
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'product_id'
    },
    productName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'product_name'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'unit_price'
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'total_price'
    }
}, {
    tableName: 'order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeValidate: (item) => {
            // Auto-calculate total price
            if (item.quantity && item.unitPrice) {
                item.totalPrice = parseFloat(item.quantity) * parseFloat(item.unitPrice);
            }
        }
    }
});

module.exports = { OrderItem };
