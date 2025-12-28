const { createMachine, createActor } = require('xstate');
const { ORDER_STATUS } = require('../models/Order');

/**
 * Order State Machine Definition
 * Implements a finite state machine for the order lifecycle
 * Using XState v5 for robust state management and transition validation
 */
const orderMachineConfig = {
    id: 'order',
    initial: 'pending',
    context: {
        orderId: null,
        userId: null,
        items: [],
        totalAmount: 0,
        retryCount: 0,
        maxRetries: 3
    },
    states: {
        pending: {
            on: {
                STOCK_CHECK_SUCCESS: {
                    target: 'stockReserved'
                },
                STOCK_CHECK_FAILED: {
                    target: 'failed'
                },
                CANCEL: {
                    target: 'cancelled'
                }
            }
        },
        stockReserved: {
            on: {
                PAYMENT_INITIATED: {
                    target: 'paymentPending'
                },
                RESERVATION_TIMEOUT: {
                    target: 'failed'
                },
                CANCEL: {
                    target: 'cancelled'
                }
            }
        },
        paymentPending: {
            on: {
                PAYMENT_SUCCESS: {
                    target: 'paid'
                },
                PAYMENT_FAILED: {
                    target: 'failed'
                },
                CANCEL: {
                    target: 'cancelled'
                }
            }
        },
        paid: {
            on: {
                CONFIRM: {
                    target: 'confirmed'
                },
                CONFIRMATION_FAILED: {
                    target: 'failed'
                }
            }
        },
        confirmed: {
            on: {
                START_PROCESSING: {
                    target: 'processing'
                },
                CANCEL: {
                    target: 'cancelled'
                }
            }
        },
        processing: {
            on: {
                SHIP: {
                    target: 'shipped'
                },
                PROCESSING_FAILED: {
                    target: 'failed'
                }
            }
        },
        shipped: {
            on: {
                DELIVER: {
                    target: 'delivered'
                },
                DELIVERY_FAILED: {
                    target: 'failed'
                }
            }
        },
        delivered: {
            type: 'final'
        },
        failed: {
            on: {
                COMPENSATION_COMPLETE: {
                    target: 'reversed'
                }
            }
        },
        cancelled: {
            on: {
                COMPENSATION_COMPLETE: {
                    target: 'reversed'
                }
            }
        },
        reversed: {
            type: 'final'
        }
    }
};

/**
 * Create a new order state machine instance
 * @param {Object} context - Initial context with orderId, userId, items, etc.
 * @returns {Object} - XState actor
 */
const createOrderMachine = (context = {}) => {
    const machine = createMachine({
        ...orderMachineConfig,
        context: {
            ...orderMachineConfig.context,
            ...context
        }
    });

    return createActor(machine);
};

/**
 * Map XState state value to ORDER_STATUS enum
 */
const stateToStatus = {
    pending: ORDER_STATUS.PENDING,
    stockReserved: ORDER_STATUS.STOCK_RESERVED,
    paymentPending: ORDER_STATUS.PAYMENT_PENDING,
    paid: ORDER_STATUS.PAID,
    confirmed: ORDER_STATUS.CONFIRMED,
    processing: ORDER_STATUS.PROCESSING,
    shipped: ORDER_STATUS.SHIPPED,
    delivered: ORDER_STATUS.DELIVERED,
    failed: ORDER_STATUS.FAILED,
    cancelled: ORDER_STATUS.CANCELLED,
    reversed: ORDER_STATUS.REVERSED
};

/**
 * Map ORDER_STATUS to XState state
 */
const statusToState = Object.fromEntries(
    Object.entries(stateToStatus).map(([k, v]) => [v, k])
);

/**
 * Get the ORDER_STATUS from a machine state
 * @param {string} stateValue - XState state value
 * @returns {string} - ORDER_STATUS enum value
 */
const getOrderStatus = (stateValue) => {
    return stateToStatus[stateValue] || ORDER_STATUS.PENDING;
};

/**
 * Get available events for a given state
 * @param {string} stateName - Current state name
 * @returns {string[]} - Array of available event names
 */
const getAvailableEvents = (stateName) => {
    const stateConfig = orderMachineConfig.states[stateName];
    if (!stateConfig || !stateConfig.on) {
        return [];
    }
    return Object.keys(stateConfig.on);
};

module.exports = {
    createOrderMachine,
    orderMachineConfig,
    stateToStatus,
    statusToState,
    getOrderStatus,
    getAvailableEvents,
    ORDER_STATUS
};
